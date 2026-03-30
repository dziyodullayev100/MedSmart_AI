const { HfInference } = require('@huggingface/inference');

// Bepul ishlovchi modellar ro'yxati (tartib bo'yicha sinab ko'riladi)
const FREE_MODELS = [
  'Qwen/Qwen2.5-72B-Instruct',
  'HuggingFaceH4/zephyr-7b-beta',
  'microsoft/Phi-3-mini-4k-instruct',
  'google/gemma-2-2b-it',
];

async function askAI(message, history = []) {
  const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

  const systemPrompt = `Sen MedSmart tibbiy yordamchi sun'iy intellektisan.
Quyidagi qoidalarga amal qil:
1. Har doim O'zbek tilida javob ber
2. Tibbiy maslahat ber, lekin shifokorga borishni tavsiya qil
3. Ko'krak og'rig'i, nafas qisishi, hushidan ketdi degan so'zlar bo'lsa DARHOL tez yordam chaqirishni ayt
4. Javoblar qisqa bo'lsin (max 3-4 jumla)
5. Har javob oxirida: Shifokorga murojaat qilishni tavsiya etamiz`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-8),
    { role: 'user', content: message }
  ];

  // Har bir bepul modelni sinab ko'ramiz
  let lastError = null;
  for (const model of FREE_MODELS) {
    try {
      console.log(`[HuggingFace] Trying model: ${model}`);
      const response = await hf.chatCompletion({
        model: model,
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
      });

      const reply = response.choices[0].message.content;
      console.log(`[HuggingFace] Success with model: ${model}`);

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
        metadata: { intent, symptoms_detected, emergency, model }
      };

    } catch (err) {
      console.warn(`[HuggingFace] Model ${model} failed:`, err.message);
      lastError = err;
      continue; // keyingi modelni sinab ko'ramiz
    }
  }

  // Hech bir model ishlamasa — xato qaytaramiz
  console.error('[HuggingFace] All models failed. Last error:', lastError?.message);
  throw new Error('AI xizmati vaqtincha ishlamayapti');
}

module.exports = { askAI };
