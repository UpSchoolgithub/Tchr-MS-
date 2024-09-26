import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import './Table.css'; // Ensure this path is correct

const StudentDetails = ({ schoolId, classId, sectionId, onUpload }) => {
  const [file, setFile] = useState(null);

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        onUpload(worksheet);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  return (
    <div>
      <h3>Upload Student Details</h3>
      <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Submit</button>
    </div>
  );
};

export default StudentDetails;
