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
    lesson_plan: Dict[str, str]

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
        
        return lesson_plan_data
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
    Endpoint for generating pre-learning lesson plans.
    Sends all topics and concepts at once to OpenAI and expects the split to be done automatically.
    """
    print("Received Pre-Learning Payload:", data.dict())  # Debug log

    try:
        # Prepare topics and ensure no missing data
        formatted_topics = [
            {
                "topic": topic.topic.strip(),
                "concepts": [{"concept": c.strip(), "detail": d.strip() if d else "N/A"}
                             for c, d in zip(topic.concepts, topic.conceptDetails or ["N/A"] * len(topic.concepts))]
            }
            for topic in data.topics
        ]

        # Separate system and user messages for better formatting
        system_msg = {
            "role": "system",
            "content": "You are a lesson planning assistant. Split the following topics and concepts into sessions of approximately 45 minutes each. Provide structured lesson plans.",
        }
        user_msg = {
            "role": "user",
            "content": json.dumps(
                {
                    "board": data.board,
                    "grade": data.grade,
                    "subject": data.subject,
                    "unit": data.unit,
                    "chapter": data.chapter,
                    "topics": formatted_topics,
                },
                indent=2,
            ),
        }

        messages = [system_msg, user_msg]

        print("Formatted OpenAI Payload:", json.dumps(messages, indent=2))

        # Make OpenAI request
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )

        lesson_plan_content = response.choices[0].message.content

        print("Generated Lesson Plan Content:", lesson_plan_content)

        return {
            "lesson_plan": {"pre_learning_plan": lesson_plan_content},
            "failed_concepts": [],
        }

    except Exception as e:
        print(f"Error generating pre-learning plan: {e}")
        raise HTTPException(status_code=500, detail="Internal server error.")
