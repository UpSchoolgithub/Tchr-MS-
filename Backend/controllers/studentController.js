const { Student, CombinedSection } = require('../models');

exports.uploadStudents = async (req, res) => {
  try {
    const { students, combinedSectionId } = req.body;

    if (!students || !combinedSectionId) {
      return res.status(400).json({ error: 'Students data and combinedSectionId are required.' });
    }

    // Ensure combinedSectionId exists
    const sectionExists = await CombinedSection.findByPk(combinedSectionId);
    if (!sectionExists) {
      return res.status(400).json({ error: 'Invalid combinedSectionId.' });
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
