const { Test } = require('../models');

exports.recordTest = async (req, res) => {
  const { studentId, date, score } = req.body;

  try {
    const test = await Test.create({ studentId, date, score });
    res.status(201).json(test);
  } catch (error) {
    console.error('Error recording test:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.getTests = async (req, res) => {
  const { studentId } = req.params;

  try {
    const tests = await Test.findAll({ where: { studentId } });
    res.status(200).json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
