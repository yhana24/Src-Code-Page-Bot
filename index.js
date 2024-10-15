const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios'); // For making API requests
const { handleMessage } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
const COMMANDS_PATH = path.join(__dirname, 'commands');

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook event handling
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN);
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      });
    });

    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

// Load all command files from the "commands" directory and add a hyphen to the name
const loadCommands = () => {
  const commands = [];

  const commandFiles = fs.readdirSync(COMMANDS_PATH).filter(file => file.endsWith('.js'));

  commandFiles.forEach(file => {
    const command = require(path.join(COMMANDS_PATH, file));
    if (command.name && command.description) {
      commands.push({
        name: `-${command.name}`, // Adding a hyphen (-) before the command name
        description: command.description
      });
    }
  });

  return commands;
};

// Load Messenger Menu Commands dynamically from command files
const loadMenuCommands = async () => {
  const commands = loadCommands();

  try {
    const loadCmd = await axios.post(`https://graph.facebook.com/v21.0/me/messenger_profile?access_token=${PAGE_ACCESS_TOKEN}`, {
      commands: [
        {
          locale: "default",
          commands: commands
        }
      ]
    }, {
      headers: {
        "Content-Type": "application/json"
      }
    });

    console.log("Menu commands loaded successfully.");
  } catch (error) {
    console.error("Error loading menu commands:", error);
  }
};

// Server initialization
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);

  // Load Messenger Menu Commands asynchronously after the server starts
  await loadMenuCommands();
});
