const axios = require('axios');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = `Sen MedSmart tibbiy yordamchi sun'iy intellektisan.
Quyidagi qoidalarga amal qil:
1. Har doim O'zbek tilida javob ber
2. Tibbiy maslahat ber, lekin shifokorga borishni tavsiya qil
3. Agar bemor ko'krak og'rig'i, nafas qisishi, hushidan ketdi, insult kabi so'zlar yozsa DARHOL tez yordam chaqirishni ayt
4. Javoblar qisqa va tushunarli bo'lsin (max 3-4 jumla)
5. Har javob oxirida: Shifokorga murojaat qilishni tavsiya etamiz`;

async function askGemini(message, history = []) {
  try {
    const payload = {
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }]
      },
      contents: [...history, { role: 'user', parts: [{ text: message }] }]
    };

    const response = await axios.post(GEMINI_URL, payload, {
      headers: { 'Content-Type': 'application/json' }
    });

    const reply = response.data.candidates[0].content.parts[0].text;
    
    // Detect emergency from reply
    const lowerReply = reply.toLowerCase();
    let emergency = false;
    if (lowerReply.includes('tez yordam') || lowerReply.includes('darhol') || lowerReply.includes('103') || lowerReply.includes('reanimatsiya')) {
      emergency = true;
    }

    // Detect symptoms from message
    const lowerText = message.toLowerCase();
    const symptomsKeywords = ['isitma', "bosh og'rig'i", "yo'tal", 'nafas qisishi', "ko'ngil aynish", 'holsizlik', "bel og'rig'i", 'fever', 'headache', 'cough', 'nausea', 'fatigue'];
    let symptoms_detected = [];
    symptomsKeywords.forEach(sym => {
      if (lowerText.includes(sym)) {
        symptoms_detected.push(sym);
      }
    });

    // Detect intent
    let intent = 'general_info';
    if (emergency) {
      intent = 'emergency';
    } else if (lowerText.includes('bosh') || lowerText.includes("og'riq") || lowerText.includes('isitma') || lowerText.includes("yo'tal") || lowerText.includes('nafas')) {
      intent = 'symptom_check';
    }

    return {
      reply,
      metadata: { intent, symptoms_detected, emergency }
    };
  } catch (error) {
    console.error('[Gemini Client] API Error:', error.response ? error.response.data : error.message);
    throw new Error('AI xizmati vaqtincha ishlamayapti');
  }
}

module.exports = { askGemini };
