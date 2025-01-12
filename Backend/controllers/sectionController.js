// controllers/sectionController.js
const { Section } = require('../models');

exports.getSectionsByClass = async (req, res) => {
  const { schoolId, classId } = req.params;

  try {
    // Find sections by schoolId and classId
    const sections = await Section.findAll({
      where: { schoolId, classInfoId: classId }
    });

    if (!sections.length) {
      return res.status(404).json({ message: 'No sections found for this class.' });
    }

    res.status(200).json(sections);
  } catch (error) {
    console.error('Error fetching sections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
