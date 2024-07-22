const express = require('express');
const router = express.Router();
const { ClassInfo, Section, Subject } = require('../models');

// Get combined classes, sections, and subjects for a school
router.get('/schools/:schoolId/classes-sections-subjects', async (req, res) => {
  try {
    console.log(`Fetching combined classes, sections, and subjects for schoolId: ${req.params.schoolId}`);
    
    const classes = await ClassInfo.findAll({
      where: { schoolId: req.params.schoolId },
      include: [
        {
          model: Section,
          include: [
            {
              model: Subject,
              attributes: ['id', 'subjectName']
            }
          ]
        }
      ]
    });

    console.log('Fetched classes:', JSON.stringify(classes, null, 2));

    const combinedList = classes.map(classItem => {
      return classItem.Sections.map(section => ({
        classId: classItem.id,
        className: classItem.className,
        sectionId: section.id,
        sectionName: section.sectionName,
        subjects: section.Subjects.map(subject => ({
          id: subject.id,
          subjectName: subject.subjectName
        }))
      }));
    }).flat();

    console.log('Combined list:', JSON.stringify(combinedList, null, 2));
    res.status(200).json(combinedList);
  } catch (error) {
    console.error('Error fetching classes, sections, and subjects:', error);
    res.status(500).json({ message: 'Error fetching classes, sections, and subjects', error: error.message, stack: error.stack });
  }
});

module.exports = router;
