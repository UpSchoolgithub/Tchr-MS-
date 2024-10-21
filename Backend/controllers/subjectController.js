// controllers/subjectController.js
const { Subject } = require('../models'); // Make sure the path is correct

// Fetch all subjects
exports.getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.findAll();
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Fetch subjects by schoolId
exports.getSubjectsBySchool = async (req, res) => {
  const { schoolId } = req.params;
  try {
    const subjects = await Subject.findAll({
      where: { schoolId }
    });
    if (!subjects.length) {
      return res.status(404).json({ message: 'No subjects found for this school.' });
    }
    res.status(200).json(subjects);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};
