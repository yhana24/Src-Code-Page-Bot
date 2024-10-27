const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { sendMessage } = require('./sendMessage');
const { handlePostback } = require('./handlePostback');

// Load command modules
const commands = Object.fromEntries(
  fs.readdirSync(path.join(__dirname, '../commands'))
    .filter(file => file.endsWith('.js'))
    .map(file => [require(`../commands/${file}`).name.toLowerCase(), require(`../commands/${file}`)])
);

const handleMessage = async (event, pageAccessToken) => {
  const senderId = event?.sender?.id;
  if (!senderId) return console.error('Invalid event object');

  const messageText = event?.message?.text?.trim();
  if (!messageText) {
    console.error('No message text found');
    return;
  }

  const [commandName, ...args] = messageText.startsWith('-') 
    ? messageText.slice(1).split(' ') 
    : messageText.split(' ');

  const cmd = commands[commandName.toLowerCase()];

  try {
    if (cmd) {
      await cmd.execute(senderId, args, pageAccessToken, event);
    } else {
      await commands['ai'].execute(senderId, [messageText], pageAccessToken);
    }
  } catch (error) {
    console.error(`Error executing command:`, error);
    await sendMessage(senderId, { text: 'There was an error executing that command.' }, pageAccessToken);
  }

  if (event?.postback) {
    try {
      await handlePostback(event, pageAccessToken);
    } catch (error) {
      console.error('Error handling postback:', error);
    }
  }
};

module.exports = { handleMessage };