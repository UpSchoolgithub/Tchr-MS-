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
    """
    Generates a detailed lesson plan for each concept under each topic provided in the data.

    Parameters:
        data (LessonPlanRequest): The request object containing lesson plan details.

    Returns:
        Dict[str, Any]: A dictionary containing the lesson plans for each concept.
    """
    all_lesson_plans = {}  # To store lesson plans for each concept
    for topic in data.topics:
        for concept in topic.concepts:
            try:
                # Create a message for the specific topic and concept
                system_msg = {
                    "role": "system",
                    "content": f"""Create a detailed and structured lesson plan session-wise based on the following details:

    - **Board**: {data.board}
    - **Grade**: {data.grade}
    - **Subject**: {data.subject}
    - **Sub-Subject**: {data.subSubject}
    - **Unit**: {data.unit}
    - **Chapter**: {data.chapter}
    - **Topic**: {topic.topic}
    - **Concept**: {concept}
    - **Session Type**: {data.sessionType}
    - **Number of Sessions**: {data.noOfSession}
    - **Duration per Session**: {data.duration} minutes

    Create a lesson plan that includes:
    - Objectives tailored to the concept.
    - Teaching aids and materials required.
    - Activities and engagement strategies specific to the concept.
    - Assessment methods to evaluate understanding of the concept.
    - Homework or follow-up activities to reinforce the concept.

    Ensure the plan is engaging, structured, and aligned with the provided educational context.
                    """
                }

                # Prepare the message payload
                messages = [system_msg]

                # Generate lesson plan using OpenAI API
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo",
                    messages=messages
                )
                
                # Extract the lesson plan content
                lesson_plan = response.choices[0].message.content
                all_lesson_plans[f"{topic.topic}: {concept}"] = lesson_plan
            except Exception as e:
                # Handle errors and log them
                print(f"Error with OpenAI API for concept '{concept}' in topic '{topic.topic}': {e}")
                all_lesson_plans[f"{topic.topic}: {concept}"] = "Error generating lesson plan."

    # Return the lesson plans for all concepts
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
