const { google } = require('googleapis');
const calendar = google.calendar('v3');
const { authorize } = require('../middleware/googleAuth');

const createEvent = async (req, res) => {
  const event = {
    summary: req.body.summary,
    location: req.body.location,
    description: req.body.description,
    start: {
      dateTime: req.body.startDateTime,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: req.body.endDateTime,
      timeZone: 'America/Los_Angeles',
    },
    recurrence: ['RRULE:FREQ=DAILY;COUNT=2'],
    attendees: req.body.attendees.map(email => ({ email })),
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  authorize((auth) => {
    calendar.events.insert(
      {
        auth,
        calendarId: 'primary',
        resource: event,
      },
      (err, event) => {
        if (err) {
          console.log('There was an error contacting the Calendar service: ' + err);
          return res.status(500).send({ error: 'Failed to create calendar event.' });
        }
        console.log('Event created: %s', event.htmlLink);
        res.send(event);
      }
    );
  });
};

module.exports = { createEvent };
