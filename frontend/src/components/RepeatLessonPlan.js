import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";

const RepeatLessonPlan = ({ show, onHide, sessionId, preLearningActions, onSuccess }) => {
    const [lessonPlans, setLessonPlans] = useState([]);
    
    useEffect(() => {
      if (preLearningActions.length > 0) {
        const initialPlans = preLearningActions.map((action) => ({
          topicName: action.topicName,
          conceptName: action.conceptName,
          lessonPlan: "",
        }));
        setLessonPlans(initialPlans); // Pre-fill plans
      }
    }, [preLearningActions]);
  
    const handleGeneratePlans = async () => {
        try {
          const generatedPlans = await Promise.all(
            lessonPlans.map(async (plan) => {
              const payload = {
                board: "ICSE",
                grade: "Class Name", // Update dynamically if needed
                subject: "Subject Name",
                unit: "Unit Name",
                chapter: plan.topicName,
                concepts: [{ concept: plan.conceptName }],
                sessionType: "Pre-learning", // Indicating the session type
                noOfSession: 1,
                duration: 45,
              };
      
              const response = await axios.post("https://tms.up.school/api/dynamicLP", payload);
              return { ...plan, lessonPlan: response.data.lesson_plan };
            })
          );
      
          setLessonPlans(generatedPlans);
          await onSuccess(); // Refresh session plans
          onHide(); // Close modal
        } catch (error) {
          console.error("Error generating lesson plans:", error);
        }
      };
      
  
    return (
      <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
          <Modal.Title>Generate Pre-learning Lesson Plans</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {lessonPlans.map((plan, index) => (
            <div key={index}>
              <h5>Topic: {plan.topicName}</h5>
              <pre>{plan.lessonPlan || "No Lesson Plan Generated"}</pre>
            </div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Close
          </Button>
          <Button variant="primary" onClick={handleGeneratePlans}>
            Generate and Save All
          </Button>
        </Modal.Footer>
      </Modal>
    );
  };
  

export default RepeatLessonPlan;
