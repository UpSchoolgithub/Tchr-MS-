const express = require('express');
const { getOAuth2Client, generateAuthUrl, getToken } = require('../middleware/googleAuth');
const router = express.Router();

router.get('/auth', (req, res) => {
  const oAuth2Client = getOAuth2Client();
  const authUrl = generateAuthUrl(oAuth2Client);
  res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  const oAuth2Client = getOAuth2Client();
  try {
    const token = await getToken(oAuth2Client, code);
    res.status(200).send('Authorization successful. You can close this window.');
  } catch (error) {
    res.status(500).send('Failed to get token');
  }
});

module.exports = router;
