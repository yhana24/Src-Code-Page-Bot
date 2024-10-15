const axios = require('axios');

module.exports = {
  name: 'vision',
  description: 'Recognize a photo using LlamaVision.',
  author: 'Nics',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    if (args.length < 2) {
      sendMessage(senderId, { text: '🌟 Please provide both a prompt and an image URL.' }, pageAccessToken);
      return;
    }

    const prompt = args.slice(0, -1).join(' ');
    const imageUrl = args[args.length - 1];

    if (!prompt) {
      sendMessage(senderId, { text: '🌟 Please provide a prompt.' }, pageAccessToken);
      return;
    }

    if (!imageUrl) {
      sendMessage(senderId, { text: '🌟 Please provide an image URL.' }, pageAccessToken);
      return;
    }

    try {
      const apiUrl = `https://www.geo-sevent-tooldph.site/api/llamavision?prompt=${encodeURIComponent(prompt)}&imageUrl=${encodeURIComponent(imageUrl)}`;
      const response = await axios.get(apiUrl);

      const text = response.data.response || 'No response received from LlamaVision. Please try again later.';

      sendMessage(senderId, { text }, pageAccessToken);

    } catch (error) {
      console.error('Error calling LlamaVision API:', error.message || error);
      sendMessage(senderId, { text: 'Sorry, there was an error processing your request: ' + error.message }, pageAccessToken);
    }
  }
};
