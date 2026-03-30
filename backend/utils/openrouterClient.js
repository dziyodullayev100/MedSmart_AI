const axios = require('axios');

async function askAI(message, history = []) {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'meta-llama/llama-3.1-8b-instruct:free',
        messages: [
          {
            role: 'system',
            content: `Sen MedSmart tibbiy yordamchi sun'iy intellektisan.
Quyidagi qoidalarga amal qil:
1. Har doim O'zbek tilida javob ber
2. Tibbiy maslahat ber, lekin shifokorga borishni tavsiya qil
3. Ko'krak og'rig'i, nafas qisishi, hushidan ketdi degan so'zlar bo'lsa DARHOL tez yordam chaqirishni ayt
4. Javoblar qisqa bo'lsin (max 3-4 jumla)
5. Har javob oxirida: Shifokorga murojaat qilishni tavsiya etamiz`
          },
          ...history.slice(-8),
          { role: 'user', content: message }
        ],
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://medsmart-frontend.netlify.app',
          'X-Title': 'MedSmart AI'
        }
      }
    );

    const reply = response.data.choices[0].message.content;

    // Detect emergency
    const emergencyWords = [
      'tez yordam', 'darhol', '103', 'reanimatsiya',
      'yurak to\'xtadi', 'hushidan ketdi', 'o\'lim'
    ];
    const emergency = emergencyWords.some(w =>
      reply.toLowerCase().includes(w) ||
      message.toLowerCase().includes(w)
    );

    // Detect intent
    const symptomWords = [
      'bosh', 'og\'riq', 'isitma', 'yo\'tal',
      'nafas', 'qorin', 'ko\'ngil'
    ];
    const hasSymptom = symptomWords.some(w =>
      message.toLowerCase().includes(w)
    );
    const intent = emergency ? 'emergency'
      : hasSymptom ? 'symptom_check'
      : 'general_info';

    // Detect symptoms
    const allSymptoms = [
      { uz: 'isitma', en: 'fever' },
      { uz: 'bosh og\'rig\'i', en: 'headache' },
      { uz: 'yo\'tal', en: 'cough' },
      { uz: 'nafas qisishi', en: 'shortness of breath' },
      { uz: 'ko\'ngil aynish', en: 'nausea' },
      { uz: 'holsizlik', en: 'fatigue' },
      { uz: 'bel og\'rig\'i', en: 'back pain' },
      { uz: 'qorin og\'rig\'i', en: 'stomach pain' }
    ];
    const symptoms_detected = allSymptoms
      .filter(s =>
        message.toLowerCase().includes(s.uz) ||
        message.toLowerCase().includes(s.en)
      )
      .map(s => s.uz);

    return {
      reply,
      metadata: { intent, symptoms_detected, emergency }
    };
  } catch (error) {
    const errorData = error.response ? error.response.data : error.message;
    console.error('[OpenRouter Client] API Error Details:', JSON.stringify(errorData, null, 2));
    throw new Error('AI xizmati vaqtincha ishlamayapti');
  }
}

module.exports = { askAI };
