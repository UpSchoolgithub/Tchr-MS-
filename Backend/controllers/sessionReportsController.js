const SessionReports = require('../models/SessionReports'); // Replace with your model

exports.getSessionReport = async (req, res) => {
  const { sessionId } = req.params;
  try {
    const report = await SessionReports.findOne({ where: { sessionId } });
    if (!report) {
      return res.status(404).json({ error: 'Not Found', message: 'Session report not found' });
    }
    res.json(report);
  } catch (error) {
    console.error('Error fetching session report:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};
