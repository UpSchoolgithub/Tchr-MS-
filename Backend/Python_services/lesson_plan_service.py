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

class LessonPlanRequest(BaseModel):
    board: str
    grade: str
    subject: str
    subSubject: str
    unit: str
    chapter: str
    topics: List[Topic]
    sessionType: str
    noOfSession: int
    duration: int
    generatedPlan: Optional[str] = None  # New field to accept modified content

class LessonPlanResponse(BaseModel):
    lesson_plan: str

def generate_lesson_plan(data: LessonPlanRequest) -> Dict[str, Any]:
    system_msg = {
        "role": "system",
        "content": f"""Create a structured lesson plan session-wise:
        
        - Board: {data.board}
        - Grade: {data.grade}
        - Subject: {data.subject}
        - Unit: {data.unit}
        - Chapter: {data.chapter}
        - Topics: {[topic.topic for topic in data.topics]}
        - Session Type: {data.sessionType}
        - Number of Sessions: {data.noOfSession}
        - Duration per Session: {data.duration} minutes
        """
    }
    messages = [system_msg]
    # Use OpenAI API to generate the lesson plan
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages
        )
        lesson_plan = response.choices[0].message.content
        return {"lesson_plan": lesson_plan}
    except Exception as e:
        print(f"Error with OpenAI API: {e}")
        return {"lesson_plan": ""}


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
        session_plans = []
        for session in data.sessions:
            topics_with_plans = []
            for topic in session["topics"]:
                concepts_with_plans = []
                for concept in topic["concepts"]:
                    plan = generate_concept_plan(data, topic["topic"], concept)
                    concepts_with_plans.append({"concept": concept, "plan": plan})
                topics_with_plans.append({"topic": topic["topic"], "concepts": concepts_with_plans})
            session_plans.append({"sessionNumber": session["sessionNumber"], "topics": topics_with_plans})
        return {"sessions": session_plans}
    except Exception as e:
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
