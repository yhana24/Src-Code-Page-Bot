const { callGeminiAPI } = require('../utils/callGeminiAPI');
const { sendMessage } = require('../handles/sendMessage');

module.exports = {
  name: 'gemini',
  description: 'Ask a question to the Gemini AI',
  author: 'ChatGPT',
  async execute(senderId, args, pageAccessToken) {
    const prompt = args.join(' ');
    sendMessage(senderId, { text: '💬 | 𝙰𝚗𝚜𝚠𝚎𝚛𝚒𝚗𝚐...' }, pageAccessToken);

    try {
      const chunks = splitMessageIntoChunks(await callGeminiAPI(prompt), 2000);
      chunks.forEach(message => sendMessage(senderId, { text: message }, pageAccessToken));
    } catch {
      sendMessage(senderId, { text: '.' }, pageAccessToken);
    }
  }
};

const splitMessageIntoChunks = (message, chunkSize) =>
  Array.from({ length: Math.ceil(message.length / chunkSize) }, (_, i) =>
    message.slice(i * chunkSize, (i + 1) * chunkSize)
  );