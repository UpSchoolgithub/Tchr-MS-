const { Student, Section } = require('../models');

exports.uploadStudents = async (req, res) => {
  try {
    const { students, combinedSectionId } = req.body;

    if (!students || !combinedSectionId) {
      return res.status(400).json({ error: 'Students data and combinedSectionId are required.' });
    }

    // Validate the combined section ID
    const sectionIds = combinedSectionId.split('-').slice(0, 3); // Assuming the format is "schoolId-classId-sectionName"
    const sectionsExist = await Section.findAll({
      where: { id: sectionIds }
    });

    if (sectionsExist.length !== sectionIds.length) {
      return res.status(400).json({ error: 'Invalid sectionId(s).' });
    }

    const studentData = students.map(student => ({
      ...student,
      combinedSectionId,
    }));

    await Student.bulkCreate(studentData);
    res.status(200).json({ message: 'Students uploaded successfully.' });
  } catch (error) {
    console.error('Error uploading students:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
