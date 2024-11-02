// controllers/teacherController.js

const { TimetableEntry, School, ClassInfo, Section, Subject, Teacher } = require('../models');

exports.getTeacherTimetable = async (req, res) => {
    const { teacherId } = req.params;
  
    try {
      const timetable = await TimetableEntry.findAll({
        where: { teacherId },
        order: [['day', 'ASC'], ['period', 'ASC']]
      });
  
      if (!timetable.length) {
        return res.status(404).json({ message: 'No timetable found for this teacher.' });
      }
  
      return res.status(200).json(timetable);
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
  