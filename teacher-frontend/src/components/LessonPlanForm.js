import React, { useState } from 'react';

const LessonPlanForm = () => {
  const [board, setBoard] = useState('');
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [subSubject, setSubSubject] = useState('');
  const [unit, setUnit] = useState('');
  const [chapter, setChapter] = useState('');
  const [topics, setTopics] = useState([]);
  const [sessionType, setSessionType] = useState('');
  const [noOfSession, setNoOfSession] = useState('');
  const [duration, setDuration] = useState('');
  const [timeUnit, setTimeUnit] = useState('minutes');
  const [generatedPlan, setGeneratedPlan] = useState(null);

  const updatedContent = (content) => {
    if (!content) return '';
    return content.replace(/[\*\-\#]/g, ''); // Remove *, -, #. from the backend content
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    const lessonPlanRequest = {
      board,
      grade,
      subject,
      subSubject,
      unit,
      chapter,
      topics: topics.map((t) => ({
        topic: t.topicName || '',
        concepts: Array.isArray(t.concepts) ? t.concepts : ['']
      })),
      sessionType,
      noOfSession,
      duration
    };

    try {
      const response = await fetch('http://localhost:8000/generate-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonPlanRequest)
      });

      if (!response.ok) throw new Error('Failed to generate lesson plan');
      
      const data = await response.json();
      setGeneratedPlan(updatedContent(data.lesson_plan)); 
      console.log(data.lesson_plan);
    } catch (error) {
      console.error('Error generating lesson plan:', error);
    }
  };

  const handleDownloadPDF = async () => {
    // Include the edited content from generatedPlan in the request
    const lessonPlanRequest = {
      board,
      grade,
      subject,
      subSubject,
      unit,
      chapter,
      topics: topics.map((t) => ({
        topic: t.topicName || '',
        concepts: Array.isArray(t.concepts) ? t.concepts : ['']
      })),
      sessionType,
      noOfSession,
      duration,
      generatedPlan // Add the updated generated plan content here
    };
  
    try {
      const response = await fetch('http://localhost:8000/download-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonPlanRequest)
      });
  
      if (!response.ok) throw new Error('Failed to download PDF');
  
      const blob = await response.blob();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'lesson_plan.pdf');
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };
  

  const addTopic = () => {
    setTopics([...topics, { topicName: '', concepts: [''] }]);
  };

  const addConcept = (topicIndex) => {
    const newTopics = [...topics];
    newTopics[topicIndex].concepts.push('');
    setTopics(newTopics);
  };

  const updateTopicName = (index, value) => {
    const newTopics = [...topics];
    newTopics[index].topicName = value;
    setTopics(newTopics);
  };

  const updateConcept = (topicIndex, conceptIndex, value) => {
    const newTopics = [...topics];
    newTopics[topicIndex].concepts[conceptIndex] = value;
    setTopics(newTopics);
  };

  const handleBack = () => {
    setGeneratedPlan(null);
  };

  return (
    <div>

      {!generatedPlan ? (
        <form onSubmit={handleGenerate}>
          <div className="form-group">
            <select value={board} onChange={(e) => setBoard(e.target.value)} required>
              <option value="">Select Board</option>
              <option value="ICSE">ICSE</option>
              <option value="CBSE">CBSE</option>
              <option value="State">State</option>
            </select>
            <select onChange={(e) => setGrade(e.target.value)} value={grade} required>
              <option value="">Select Grade</option>
              {[...Array(10).keys()].map((i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <select onChange={(e) => setSubject(e.target.value)} value={subject} required>
              <option value="">Select Subject</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Science">Science</option>
              <option value="Social Science">Social Science</option>
              <option value="English">English</option>
            </select>

            {subject === 'Science' && (
              <select onChange={(e) => setSubSubject(e.target.value)} value={subSubject} required>
                <option value="">Select Science Subcategory</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
              </select>
            )}
            {subject === 'Social Science' && (
              <select onChange={(e) => setSubSubject(e.target.value)} value={subSubject} required>
                <option value="">Select Social Science Subcategory</option>
                <option value="History">History</option>
                <option value="Civics">Civics</option>
                <option value="Geography">Geography</option>
              </select>
            )}
            {subject === 'English' && (
              <select onChange={(e) => setSubSubject(e.target.value)} value={subSubject} required>
                <option value="Language">Language</option>
                <option value="Literature">Literature</option>
              </select>
            )}
          </div>

          <div className="form-group">
            <input type="text" placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} required />
            <input type="text" placeholder="Chapter" value={chapter} onChange={(e) => setChapter(e.target.value)} required />
          </div>

          <div className="form-group">
            {Array.isArray(topics) && topics.map((topic, index) => (
              <div key={index}>
                <input
                  type="text"
                  placeholder={`Topic ${index + 1}`}
                  value={topic.topicName || ''}
                  onChange={(e) => updateTopicName(index, e.target.value)}
                  required
                />
                {Array.isArray(topic.concepts) && topic.concepts.map((concept, cIndex) => (
                  <input
                    key={cIndex}
                    type="text"
                    placeholder={`Concept ${cIndex + 1}`}
                    value={concept || ''}
                    onChange={(e) => updateConcept(index, cIndex, e.target.value)}
                    required
                  />
                ))}
                <button type="button" onClick={() => addConcept(index)}>Add Concept</button>
              </div>
            ))}
            <button type="button" onClick={addTopic}>Add Topic</button>
          </div>

          <div className="form-group">
            <select onChange={(e) => setSessionType(e.target.value)} value={sessionType} required>
              <option value="">Select Session Type</option>
              <option value="Theory">Theory</option>
              <option value="Practical">Practical</option>
              <option value="Both">Theory & Practical</option>
            </select>
            <input type="number" placeholder="No of Sessions" value={noOfSession} onChange={(e) => setNoOfSession(e.target.value)} required />
          </div>

          <div className="form-group">
            <input type="number" placeholder="Duration of Session" value={duration} onChange={(e) => setDuration(e.target.value)} required />
            <select onChange={(e) => setTimeUnit(e.target.value)} value={timeUnit} required>
              <option value="minutes">Minutes</option>
              <option value="hours">Hours</option>
            </select>
          </div>
          
          <button type="submit">Generate Lesson Plan</button>
        </form>
      ) : (
        <div>
          <h2>Generated Lesson Plan:</h2>
          <textarea value={generatedPlan} onChange={(e) => setGeneratedPlan(e.target.value)}
            rows={50}
            cols={50}
          />
          <div className='btn'>
          <button onClick={handleDownloadPDF}>Download PDF</button>
          <button onClick={handleBack}>Back</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanForm;
