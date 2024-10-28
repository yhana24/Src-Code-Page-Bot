const axios = require('axios');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gpt4',
  description: 'Interact with GPT-4 Turbo.',
  usage: 'gpt4 [your message]',
  author: 'coffee',

  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    if (!prompt) return sendMessage(senderId, { text: "Usage: gpt4 <your prompt>" }, pageAccessToken);

    try {
      const { data } = await axios.get(`https://ryuu-rest-apis.onrender.com/api/gpt-4-turbo?q=${encodeURIComponent(prompt)}&id=${senderId}`);
      const content = JSON.parse(data.content);
      const imageUrl = content.match(/!image(.*?)/)?.[1];

      if (!imageUrl) return sendMessage(senderId, { text: 'No image found in the response.' }, pageAccessToken);

      const { data: imageBuffer } = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const { data: uploadResponse } = await axios.post('https://api.imgur.com/3/image', {
        image: imageBuffer.toString('base64'),
        type: 'base64'
      }, { headers: { Authorization: 'Client-ID 7f22d7191831cfc' } });

      await sendMessage(senderId, { text: content.prompt }, pageAccessToken);
      await sendMessage(senderId, { attachment: { type: 'image', payload: { url: uploadResponse.data.data.link } } }, pageAccessToken);
      
    } catch (error) {
      console.error('Error:', error);
      sendMessage(senderId, { text: 'Error: Could not generate or upload image.' }, pageAccessToken);
    }
  }
};