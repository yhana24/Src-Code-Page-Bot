const express = require('express');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const app = express();
app.use(express.json());

const VERIFY_TOKEN = 'pagebot';
const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();
const COMMANDS_PATH = path.join(__dirname, 'commands');

app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }
  res.sendStatus(mode && token ? 403 : 400); // Forbidden or Bad Request
});

app.post('/webhook', (req, res) => {
  if (req.body.object !== 'page') return res.sendStatus(404);

  req.body.entry?.forEach(entry => {
    entry.messaging?.forEach(event => {
      if (event.message) handleMessage(event, PAGE_ACCESS_TOKEN);
      else if (event.postback) handlePostback(event, PAGE_ACCESS_TOKEN);
    });
  });

  res.status(200).send('EVENT_RECEIVED');
});


const sendMessengerProfileRequest = async (method, url, data = null) => {
  try {
    const { data: responseData } = await axios({
      method,
      url: `https://graph.facebook.com/v21.0${url}?access_token=${PAGE_ACCESS_TOKEN}`,
      headers: { 'Content-Type': 'application/json' },
      data
    });
    return responseData;
  } catch (error) {
    console.error(`Error in ${method} request:`, error.response?.data || error.message);
    throw error;
  }
};


const loadCommands = () => fs.readdirSync(COMMANDS_PATH)
  .filter(file => file.endsWith('.js'))
  .map(file => require(path.join(COMMANDS_PATH, file)))
  .filter(cmd => cmd.name && cmd.description);

const loadMenuCommands = async (isReload = false) => {
  const commands = loadCommands();
  if (isReload) await sendMessengerProfileRequest('delete', '/me/messenger_profile', { fields: ['commands'] });
  await sendMessengerProfileRequest('post', '/me/messenger_profile', { commands: [{ locale: 'default', commands }] });
  console.log('Menu commands loaded successfully.');
};

fs.watch(COMMANDS_PATH, (eventType, filename) => {
  if (['change', 'rename'].includes(eventType) && filename.endsWith('.js')) {
    loadMenuCommands(true).catch(console.error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  await loadMenuCommands();
});