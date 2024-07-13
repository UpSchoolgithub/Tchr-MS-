import React from 'react';
import { useParams } from 'react-router-dom';
import SessionManagement from '../components/SessionManagement';

const SchoolPage = () => {
  const { schoolId, classId, sectionId } = useParams();

  return (
    <div>
      <SessionManagement schoolId={schoolId} classId={classId} sectionId={sectionId} />
    </div>
  );
};

export default SchoolPage;
