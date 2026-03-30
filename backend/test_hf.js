require('dotenv').config();
const { askAI } = require('./utils/huggingfaceClient');

async function test() {
  console.log('=== MedSmart HuggingFace Test ===');
  console.log('KEY:', process.env.HUGGINGFACE_API_KEY ? 'SET' : 'MISSING');
  console.log('');
  
  try {
    const result = await askAI('salom');
    console.log('');
    console.log('=== SUCCESS! ===');
    console.log('Reply:', result.reply);
    console.log('Model:', result.metadata.model);
    console.log('Intent:', result.metadata.intent);
  } catch (err) {
    console.error('=== FAILED ===');
    console.error(err.message);
  }
}

test();
