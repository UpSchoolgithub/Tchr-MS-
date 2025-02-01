import os
from fastapi import FastAPI, HTTPException,APIRouter
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
import json

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Topic(BaseModel):
    topic: str
    concepts: List[str]
    conceptDetails: Optional[List[str]] = []  # New field for concept detailing

class LessonPlanRequest(BaseModel):
    board: str
    grade: str
    subject: str
    unit: str
    chapter: str
    topics: List[Topic]
    sessionType: str
    noOfSession: int
    duration: int
    generatedPlan: Optional[str] = None  # New field to accept modified content

class LessonPlanResponse(BaseModel):
    lesson_plan: Dict[str, Dict[str, Dict[str, Any]]]


def allocate_time(concept_details: List[str], total_duration: int) -> List[int]:
    if not concept_details or all(not d.strip() for d in concept_details):
        # Equal time allocation if conceptDetails are empty
        return [total_duration // len(concept_details)] * len(concept_details)

    word_counts = [len(detail.split()) for detail in concept_details]
    total_words = sum(word_counts)
    allocated_times = [int(total_duration * (count / total_words)) for count in word_counts]

    # Adjust remaining time
    remaining_time = total_duration - sum(allocated_times)
    if remaining_time > 0:
        allocated_times[-1] += remaining_time

    return allocated_times



def generate_lesson_plan(data: LessonPlanRequest) -> Dict[str, Any]:
    all_lesson_plans = {}  # Store lesson plans grouped by topic
    for topic in data.topics:
        topic_plans = {}
        concept_durations = allocate_time(topic.conceptDetails, data.duration)

        for concept, concept_detail, duration in zip(topic.concepts, topic.conceptDetails, concept_durations):
            try:
                # Create a message for the specific concept with its allocated time
                system_msg = {
                    "role": "system",
                    "content": f"""Create a detailed and structured lesson plan based on the concept and its details provided below. Use the concept details to create the plan and align it with the specified parameters. The lesson plan must follow the given format:

                    
                    - **Board**: {data.board}
                    - **Grade**: {data.grade}
                    - **Subject**: {data.subject}
                    - **Unit**: {data.unit}
                    - **Chapter**: {data.chapter}
                    - **Topic**: {topic.topic}
                    - **Concept**: {concept}

                    **Duration**: {duration} minutes 

                    **Objectives**:
                    - List specific learning objectives for this concept.

                    **Teaching Aids**:
                    - Mention any tools, resources, or materials required.

                    **Prerequisites**:
                    - Outline the prior knowledge or skills needed for students to understand the concept.

                    **Content**:
                    - Provide a detailed explanation of the concept using the concept details.

                    **Activities**:
                    - Include interactive or engaging activities that utilize the allocated time effectively.

                    **Summary**:
                    - Summarize the key takeaways from the lesson.

                    **Homework**:
                    - Assign relevant tasks or exercises to reinforce the concept.
                    """
                }
                messages = [system_msg]
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages
                )
                lesson_plan = response.choices[0].message.content
                # Store lesson plan by concept
                topic_plans[concept] = {
                    "lesson_plan": lesson_plan,
                    "duration": duration
                }
            except Exception as e:
                print(f"Error with OpenAI API for concept {concept}: {e}")
                topic_plans[concept] = {
                    "lesson_plan": "Error generating lesson plan.",
                    "duration": duration
                }

        all_lesson_plans[topic.topic] = topic_plans

    return {"lesson_plan": all_lesson_plans}


def create_pdf(lesson_plan: str) -> str:
    pdf_path = "lesson_plan.pdf"
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.drawString(100, 750, "Lesson Plan")
    text = c.beginText(100, 730)
    text.setFont("Helvetica", 10)
    text.setLeading(12)

    for line in lesson_plan.splitlines():
        text.textLine(line)
    
    c.drawText(text)
    c.save()
    return pdf_path

@app.post("/generate-lesson-plan", response_model=LessonPlanResponse)
async def generate_lesson_plan_endpoint(data: LessonPlanRequest):
    print("Received Payload:", data.dict())  # Log the full incoming payload
    try:
        lesson_plan_data = generate_lesson_plan(data)
        print("Generated Lesson Plan:", lesson_plan_data)  # Log the generated plan

        if not lesson_plan_data["lesson_plan"]:
            raise HTTPException(status_code=500, detail="Failed to generate lesson plan.")

        # ✅ Flattening the lesson plan content to a single string
        flattened_plan = ""
        for topic, concepts in lesson_plan_data["lesson_plan"].items():
            flattened_plan += f"### {topic} ###\n\n"
            for concept, details in concepts.items():
                flattened_plan += f"**{concept}**:\n{details['lesson_plan']}\n\n"

        return {"lesson_plan": flattened_plan.strip()}

    except Exception as e:
        print(f"Error generating lesson plan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/download-pdf")
async def download_pdf(data: LessonPlanRequest):
    # Check if `generatedPlan` exists and use it; otherwise, generate a new lesson plan
    lesson_plan = data.generatedPlan if data.generatedPlan else generate_lesson_plan(data)["lesson_plan"]
    if not lesson_plan:
        raise HTTPException(status_code=500, detail="Failed to generate lesson plan.")
    
    pdf_path = create_pdf(lesson_plan)
    if not os.path.exists(pdf_path):
        raise HTTPException(status_code=500, detail="Failed to create PDF.")
    
    return FileResponse(pdf_path, media_type="application/pdf", filename="lesson_plan.pdf")


#####################################################################
@app.post("/generate-prelearning-plan", response_model=LessonPlanResponse)
async def generate_prelearning_plan(data: LessonPlanRequest):
    """
    Automatically generates a lesson plan in batches based on:
    - Class, Subject, Board, Chapter, Unit, Topics, and Concepts.
    """
    print("Received Pre-Learning Payload:", data.dict())  # Debug log

    try:
        formatted_topics = [
            {
                "topic": topic.topic.strip(),
                "concepts": [{"concept": c.strip(), "detail": d.strip() if d else "N/A"}
                             for c, d in zip(topic.concepts, topic.conceptDetails or ["N/A"] * len(topic.concepts))]
            }
            for topic in data.topics
        ]

        # **Step 1:** Ask OpenAI how many sessions are required
        system_msg = {
            "role": "system",
            "content": (
                "You are an expert lesson planning assistant. Based on the following details, determine the number "
                "of 45-minute sessions required to cover the topics and concepts listed below.\n\n"
                "Take into account the following details:\n"
                f"- **Board**: {data.board}\n"
                f"- **Grade**: {data.grade}\n"
                f"- **Subject**: {data.subject}\n"
                f"- **Unit**: {data.unit}\n"
                f"- **Chapter**: {data.chapter}\n\n"
                "Respond with only the number of sessions required."
            )
        }

        user_msg = {
            "role": "user",
            "content": json.dumps(
                {
                    "class": data.grade,
                    "board": data.board,
                    "subject": data.subject,
                    "unit": data.unit,
                    "chapter": data.chapter,
                    "topics": formatted_topics,
                },
                indent=2,
            ),
        }

        messages = [system_msg, user_msg]

        # Request OpenAI for the number of sessions required
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )

        session_count_text = response.choices[0].message.content.strip()
        print("Session Count Response:", session_count_text)

        try:
            num_sessions = int(session_count_text)  # Convert OpenAI's response to integer
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid response for session count.")

        print(f"Total Sessions Needed: {num_sessions}")

        # **Step 2:** Automatically request session plans for each session
        session_plans = {}
        session_index = 1

        while session_index <= num_sessions:
            print(f"Requesting Session {session_index}...")

            # System message to generate a specific session plan
            session_system_msg = {
                "role": "system",
                "content": (
                    "You are a detailed lesson planning assistant. Generate a lesson plan for a 45-minute session "
                    "based on the educational details provided below:\n\n"
                    f"- **Board**: {data.board}\n"
                    f"- **Grade**: {data.grade}\n"
                    f"- **Subject**: {data.subject}\n"
                    f"- **Unit**: {data.unit}\n"
                    f"- **Chapter**: {data.chapter}\n"
                    f"- **Session**: {session_index} out of {num_sessions}.\n\n"
                    "Include objectives, teaching aids, content explanation, interactive activities, and a summary."
                )
            }

            session_user_msg = {
                "role": "user",
                "content": json.dumps(
                    {
                        "topics": formatted_topics,
                        "current_session_index": session_index,
                        "total_sessions": num_sessions,
                        "session_duration": "45 minutes"
                    },
                    indent=2
                ),
            }

            # Request the session plan
            session_response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[session_system_msg, session_user_msg]
            )

            session_plan = session_response.choices[0].message.content.strip()
            session_plans[f"Session_{session_index}"] = session_plan
            session_index += 1

            print(f"Generated Session {session_index - 1} Plan:", session_plan)

        # **Final Response:** Return the complete lesson plan as a single response
        return {
            "lesson_plan": session_plans,
            "failed_concepts": [],
        }

    except Exception as e:
        print(f"Error generating pre-learning plan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
