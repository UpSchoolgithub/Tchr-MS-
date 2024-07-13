const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TOKEN_PATH = path.join(__dirname, '../token.json');
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');

// Load client secrets from a local file.
let credentials;
try {
  credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (err) {
  console.error('Error loading client secret file:', err);
  process.exit(1); // Exit if credentials are not found
}

const { client_secret, client_id, redirect_uris } = credentials.web;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const getAuthUrl = () => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
};

const setCredentials = (tokens) => {
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
};

const createEvent = async (event) => {
  const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });
  const response = await calendar.events.insert({
    auth: oAuth2Client,
    calendarId: 'primary',
    resource: event,
  });
  return response.data;
};

module.exports = {
  getAuthUrl,
  setCredentials,
  createEvent,
  oAuth2Client // Ensure this is exported
};
