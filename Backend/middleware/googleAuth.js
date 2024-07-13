const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const path = require('path');
const credentialsPath = path.join(__dirname, '../config/credentials.json');
const tokenPath = path.join(__dirname, '../config/token.json');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

const getOAuth2Client = () => {
  const credentials = JSON.parse(fs.readFileSync(credentialsPath));
  const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
  const oAuth2Client = new OAuth2(client_id, client_secret, redirect_uris[0]);
  return oAuth2Client;
};

const generateAuthUrl = (oAuth2Client) => {
  return oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
};

const getToken = async (oAuth2Client, code) => {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  return tokens;
};

module.exports = { getOAuth2Client, generateAuthUrl, getToken };
