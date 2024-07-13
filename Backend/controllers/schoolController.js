// schoolController.js

// controllers/schoolController.js
const db = require('../config/db');

// Fetch all schools
exports.getSchools = (req, res) => {
    const sql = 'SELECT * FROM schools';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching schools:', err);
            return res.status(500).send({ error: 'Database query error' });
        }
        res.send(results);
    });
};

// Fetch school by ID
exports.getSchoolById = (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM schools WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            console.error('Error fetching school by ID:', err);
            return res.status(500).send({ error: 'Database query error' });
        }
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.status(404).send({ message: 'School not found' });
        }
    });
};

// Create a new school
exports.createSchool = (req, res) => {
    const { name, email, phone, website } = req.body;
    let logo = null;
    if (req.file) {
        logo = req.file.filename;
    }

    if (!name || !email) {
        return res.status(400).send({ error: 'Name and email are required' });
    }

    const sql = 'INSERT INTO schools (name, logo, email, phone, website) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [name, logo, email, phone, website], (err, results) => {
        if (err) {
            console.error('Error creating school:', err);
            return res.status(500).send({ error: 'Database query error', details: err.message });
        }
        res.send({ id: results.insertId, ...req.body });
    });
};

// Update a school
exports.updateSchool = (req, res) => {
    const { id } = req.params;
    const { name, logo, email, phone, website } = req.body;
    const sql = 'UPDATE schools SET name = ?, logo = ?, email = ?, phone = ?, website = ? WHERE id = ?';
    db.query(sql, [name, logo, email, phone, website, id], (err, results) => {
        if (err) {
            console.error('Error updating school:', err);
            return res.status(500).send({ error: 'Database query error' });
        }
        res.send({ id, ...req.body });
    });
};

// Delete a school
exports.deleteSchool = (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM schools WHERE id = ?';
    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error('Error deleting school:', err);
            return res.status(500).send({ error: 'Database query error' });
        }
        res.send({ message: 'School deleted' });
    });
};


exports.updateTimetable = async (req, res) => {
    const { id } = req.params;
    const {
      periodsPerDay,
      periodDuration,
      lunchBreakStart,
      lunchBreakEnd,
      shortBreak1Start,
      shortBreak1End,
      shortBreak2Start,
      shortBreak2End,
      schoolStart,
      schoolEnd,
      assemblyStart,
      assemblyEnd,
      reserveDay,
      reserveStartTime,
      reserveEndTime,
    } = req.body;
  
    try {
      const timetable = {
        periodsPerDay,
        periodDuration,
        lunchBreakStart,
        lunchBreakEnd,
        shortBreak1Start,
        shortBreak1End,
        shortBreak2Start,
        shortBreak2End,
        schoolStart,
        schoolEnd,
        assemblyStart,
        assemblyEnd,
        reserveDay,
        reserveStartTime,
        reserveEndTime,
      };
  
      // Save the timetable in your database (assuming you have a Timetable model and related logic)
      // Example using a hypothetical Timetable model:
      const updatedTimetable = await Timetable.findOneAndUpdate({ schoolId: id }, timetable, {
        new: true,
        upsert: true,
      });
  
      res.json(updatedTimetable);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update timetable settings' });
    }
  };