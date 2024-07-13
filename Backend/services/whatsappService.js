require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

console.log('Twilio Account SID:', accountSid);
console.log('Twilio Auth Token:', authToken ? 'Set' : 'Not Set');
console.log('Twilio WhatsApp Number:', whatsappNumber);

if (!accountSid || !authToken || !whatsappNumber) {
  throw new Error('Twilio credentials are not set in environment variables');
}

const client = new twilio(accountSid, authToken);

const sendWhatsAppMessage = async (to, body) => {
  try {
    await client.messages.create({
      body,
      from: whatsappNumber,
      to: `whatsapp:${to}`
    });
    console.log('WhatsApp message sent successfully');
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    throw error;
  }
};

module.exports = { sendWhatsAppMessage };
