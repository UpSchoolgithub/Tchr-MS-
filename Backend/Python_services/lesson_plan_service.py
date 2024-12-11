import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from fastapi.responses import FileResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from openai import OpenAI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware

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

def generate_lesson_plan(data: LessonPlanRequest) -> Dict[str, Any]:
    all_lesson_plans = {}  # Store lesson plans for each concept grouped by topic
    for topic in data.topics:
        topic_plans = {}
        for concept, concept_detail in zip(topic.concepts, topic.conceptDetails):
            try:
                # Create a message for the specific concept with its detailing
                system_msg = {
                    "role": "system",
                    "content": f"""Create a detailed and structured lesson plan session-wise based on the following details:

                    - **Board**: {data.board}
                    - **Grade**: {data.grade}
                    - **Subject**: {data.subject}
                    - **Unit**: {data.unit}
                    - **Chapter**: {data.chapter}
                    - **Topic**: {topic.topic}
                    - **Concept**: {concept}
                    - **Concept Detailing**: {concept_detail}
                    - **Session Type**: {data.sessionType}
                    - **Number of Sessions**: {data.noOfSession}
                    - **Duration per Session**: {data.duration} minutes

                    Ensure the lesson plan highlights the specific **concept** in detail, including learning objectives, teaching aids, activities, and assessments related to the concept.
                    """
                }
                messages = [system_msg]
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages
                )
                lesson_plan = response.choices[0].message.content
                topic_plans[concept] = lesson_plan
            except Exception as e:
                print(f"Error with OpenAI API for concept {concept}: {e}")
                topic_plans[concept] = "Error generating lesson plan."

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
    try:
        lesson_plan_data = generate_lesson_plan(data)
        if not lesson_plan_data["lesson_plan"]:
            raise HTTPException(status_code=500, detail="Failed to generate lesson plan.")
        
        return lesson_plan_data  # Return all lesson plans concept-wise
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
