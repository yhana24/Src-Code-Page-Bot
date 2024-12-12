const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');
require('./handles/sendMessage'); // Global functions

const app = express();
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
const COMMANDS_PATH = path.join(__dirname, 'commands');
const API_URL = `https://graph.facebook.com/v21.0`;

app.use(express.json());

app.get('/webhook', (req, res) =>
  req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'pagebot'
    ? res.status(200).send(req.query['hub.challenge'])
    : res.sendStatus(403)
);

app.post('/webhook', (req, res) => {
  if (req.body.object === 'page') {
    req.body.entry.forEach(entry => entry.messaging.forEach(event => 
      (event.message ? handleMessage : handlePostback)(event, PAGE_ACCESS_TOKEN)
    ));
    return res.status(200).send('EVENT_RECEIVED');
  }
  res.sendStatus(404);
});

const sendProfileRequest = async (method, endpoint, data) => {
  try {
    const { data: resData } = await axios({
      method,
      url: `${API_URL}${endpoint}?access_token=${PAGE_ACCESS_TOKEN}`,
      headers: { 'Content-Type': 'application/json' },
      data
    });
    return resData;
  } catch (error) {
    console.error(`Error in ${method} request:`, error.response?.data || error.message);
    throw error;
  }
};

const loadCommands = () => 
  fs.readdirSync(COMMANDS_PATH)
    .filter(file => file.endsWith('.js'))
    .map(file => require(path.join(COMMANDS_PATH, file)))
    .filter(({ name, description }) => name && description);

const loadMenuCommands = async (isReload = false) => {
  try {
    // Load all commands
    const allCommands = loadCommands();
    const menuCommands = [];

    // Limit to a maximum of 3 buttons for the menu
    for (let i = 0; i < Math.min(allCommands.length, 3); i++) {
      menuCommands.push({
        type: 'postback',
        title: allCommands[i].name,
        payload: allCommands[i].name.toUpperCase() + '_COMMAND',
      });
    }

    // Add a button to display all commands if there are more than 3
    if (allCommands.length > 3) {
      menuCommands.push({
        type: 'postback',
        title: 'Show More Commands',
        payload: 'SHOW_MORE_COMMANDS',
      });
    }

    // Send menu commands to Messenger Profile API (replaces the persistent menu)
    await sendProfileRequest('post', '/me/messenger_profile', {
      get_started: { payload: 'GET_STARTED_COMMAND' }, // Optional: Get Started button
      greeting: [{ locale: 'default', text: 'Welcome to the bot!' }],
      call_to_actions: menuCommands, // Messenger menu commands
    });

    console.log(`Menu commands ${isReload ? 'reloaded' : 'loaded'} successfully.`);
  } catch (err) {
    console.error(`Error ${isReload ? 'reloading' : 'loading'} menu commands:`, err);
  }
};

fs.watch(COMMANDS_PATH, (_, filename) => {
  if (filename.endsWith('.js')) loadMenuCommands(true).catch(console.error);
});

app.listen(process.env.PORT || 3000, () => {
  console.log('Server running on port', process.env.PORT || 3000);
  loadMenuCommands().catch(console.error);
});