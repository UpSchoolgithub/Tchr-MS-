const { Event } = require('../models');

exports.createEvent = async (req, res) => {
  try {
    const { eventName, startDate, endDate, startTime, endTime, schoolId, recurrence, description } = req.body;
    const newEvent = await Event.create({
      eventName,
      startDate,
      endDate,
      startTime,
      endTime,
      schoolId,
      recurrence,
      description
    });
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ message: 'Error creating event', error: error.message });
  }
};

exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventName, startDate, endDate, startTime, endTime, schoolId, recurrence, description } = req.body;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await event.update({ eventName, startDate, endDate, startTime, endTime, schoolId, recurrence, description });
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Error updating event', error: error.message });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    await event.destroy();
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting event', error: error.message });
  }
};

exports.getEvents = async (req, res) => {
  try {
    const { schoolId } = req.params;
    const events = await Event.findAll({ where: { schoolId } });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching events', error: error.message });
  }
};

exports.uploadEvents = async (req, res) => {
  try {
    const file = req.file;
    const workbook = xlsx.readFile(file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const events = xlsx.utils.sheet_to_json(sheet);

    for (const event of events) {
      await Event.create(event);
    }

    res.status(201).json({ message: 'Events uploaded successfully' });
  } catch (error) {
    res.status(400).json({ error: 'Failed to upload events', error: error.message });
  }
};
