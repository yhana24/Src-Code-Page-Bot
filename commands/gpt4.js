const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'Generate text using toshia datasets',
  author: 'coffee',
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) return sendMessage(senderId, { text: "Usage: gpt4 <question>" }, pageAccessToken);
    
    sendMessage(senderId, { text: 'Generating content... Please wait.' }, pageAccessToken);

    try {
      const { data: { result } } = await axios.get(`https://joshweb.click/api/gpt-4o?q=${encodeURIComponent(prompt)}&uid=${senderId}`);
      sendMessage(senderId, { text: result }, pageAccessToken);
    } catch {
      sendMessage(senderId, { text: 'There was an error generating the content. Please try again later.' }, pageAccessToken);
    }
  }
};