"""
medical_chat.py — MedSmart AI Medical Chat Engine
Supports: symptom detection (EN + UZ), intent detection,
          rule-based response generation, emergency detection,
          language detection, and conversation context.
"""
from __future__ import annotations
import re
from typing import Optional

# ─── Language Detection (langdetect with fallback) ────────────────────────────

def _detect_language(text: str) -> str:
    """Return 'uz' if Uzbek is detected, else 'en'."""
    text_lower = text.lower()
    
    # 1. Primary Check: Look for common Uzbek medical markers FIRST
    uz_markers = [
        "salom", "assalomu", "isitma", "bosh", "og'riq", "yo'tal", "og'riyapti", "mening",
        "holsiz", "charchaq", "ko'ngil", "nafas", "qorin", "iltimos", "qattiq", "qilay",
        "rahmat", "shifokor", "kasallik", "dori", "og'riqni", "og'riqim", "nima"
    ]
    
    for marker in uz_markers:
        if marker in text_lower:
            return "uz"
            
    # 2. Secondary Check: Langdetect package
    try:
        from langdetect import detect  # type: ignore
        lang = detect(text)
        return "uz" if lang in ("uz", "tr", "az", "tk", "ky", "kk") else "en"
    except Exception:
        pass
        
    return "en"


# ─── Symptom Dictionaries ──────────────────────────────────────────────────────

# EN symptom keyword → canonical symptom name
EN_SYMPTOMS: dict[str, str] = {
    "fever": "fever",
    "high temperature": "fever",
    "temperature": "fever",
    "headache": "headache",
    "head pain": "headache",
    "cough": "cough",
    "coughing": "cough",
    "fatigue": "fatigue",
    "tired": "fatigue",
    "tiredness": "fatigue",
    "exhausted": "fatigue",
    "chest pain": "chest pain",
    "chest ache": "chest pain",
    "shortness of breath": "shortness of breath",
    "difficulty breathing": "shortness of breath",
    "can't breathe": "shortness of breath",
    "breathless": "shortness of breath",
    "nausea": "nausea",
    "feel sick": "nausea",
    "nauseous": "nausea",
    "vomiting": "vomiting",
    "vomit": "vomiting",
    "throwing up": "vomiting",
    "dizziness": "dizziness",
    "dizzy": "dizziness",
    "lightheaded": "dizziness",
    "back pain": "back pain",
    "backache": "back pain",
    "joint pain": "joint pain",
    "joint ache": "joint pain",
    "sore throat": "sore throat",
    "throat pain": "sore throat",
    "runny nose": "runny nose",
    "stuffy nose": "runny nose",
    "nasal congestion": "runny nose",
    "stomach pain": "stomach pain",
    "abdominal pain": "stomach pain",
    "belly pain": "stomach pain",
    "diarrhea": "diarrhea",
    "loose stool": "diarrhea",
    "constipation": "constipation",
    "rash": "rash",
    "skin rash": "rash",
    "itching": "itching",
    "itch": "itching",
    "swelling": "swelling",
    "swollen": "swelling",
    "blurred vision": "blurred vision",
    "blurry vision": "blurred vision",
    "vision problem": "blurred vision",
    "heart palpitations": "heart palpitations",
    "palpitation": "heart palpitations",
    "racing heart": "heart palpitations",
    "fast heartbeat": "heart palpitations",
    "numbness": "numbness",
    "tingling": "tingling",
    "confusion": "confusion",
    "disoriented": "confusion",
    "unconscious": "unconscious",
    "passed out": "unconscious",
    "fainted": "unconscious",
    "severe bleeding": "severe bleeding",
    "bleeding": "bleeding",
    "stroke": "stroke",
    "trouble speaking": "trouble speaking",
    "slurred speech": "trouble speaking",
    "facial drooping": "facial drooping",
    "loss of appetite": "loss of appetite",
    "no appetite": "loss of appetite",
    "insomnia": "insomnia",
    "can't sleep": "insomnia",
    "muscle pain": "muscle pain",
    "muscle ache": "muscle pain",
    "migraine": "migraine",
    "anxiety": "anxiety",
    "depression": "depression",
}

# UZ symptom keyword → canonical symptom name (same canonical as EN)
UZ_SYMPTOMS: dict[str, str] = {
    "isitma": "fever",
    "harorat": "fever",
    "yuqori harorat": "fever",
    "bosh og'riq": "headache",
    "boshim og'riydi": "headache",
    "bosh og'riydi": "headache",
    "boshim": "headache",
    "yo'tal": "cough",
    "yo'talyapman": "cough",
    "holsizlik": "fatigue",
    "charchash": "fatigue",
    "charchoq": "fatigue",
    "holsiz": "fatigue",
    "ko'krak og'rig'i": "chest pain",
    "ko'krak og'ridi": "chest pain",
    "ko'kragim og'riydi": "chest pain",
    "nafas qisinishi": "shortness of breath",
    "nafas olmayapman": "shortness of breath",
    "nafas": "shortness of breath",
    "ko'ngil aynishi": "nausea",
    "ko'nglim ayniydi": "nausea",
    "ko'ngil": "nausea",
    "qasd qilish": "vomiting",
    "qayt qilish": "vomiting",
    "bosh aylanishi": "dizziness",
    "boshim aylanadi": "dizziness",
    "bel og'riq": "back pain",
    "belim og'riydi": "back pain",
    "bo'g'im og'rig'i": "joint pain",
    "bo'g'imim og'riydi": "joint pain",
    "tomoq og'rig'i": "sore throat",
    "tomog'im og'riydi": "sore throat",
    "tumov": "runny nose",
    "burunim oqadi": "runny nose",
    "qorin og'rig'i": "stomach pain",
    "qorinim og'riydi": "stomach pain",
    "ich ketish": "diarrhea",
    "ich": "diarrhea",
    "ich qotish": "constipation",
    "toshma": "rash",
    "qichishish": "itching",
    "shish": "swelling",
    "ko'zim xira": "blurred vision",
    "ko'rishim yomonlashdi": "blurred vision",
    "yurak urishi tezlashdi": "heart palpitations",
    "yurak": "heart palpitations",
    "hushsizlik": "unconscious",
    "hushini yo'qotish": "unconscious",
    "qon ketish": "severe bleeding",
    "qon": "bleeding",
    "ishtaha yo'q": "loss of appetite",
    "uxlay olmayapman": "insomnia",
    "mushaklarim og'riydi": "muscle pain",
    "migran": "migraine",
    "tashvish": "anxiety",
    "depressiya": "depression",
}

# ─── Emergency symptom patterns ───────────────────────────────────────────────

EMERGENCY_SYMPTOMS = {
    "chest pain", "shortness of breath", "unconscious",
    "severe bleeding", "stroke", "trouble speaking",
    "facial drooping", "numbness",
}

EMERGENCY_COMBOS = [
    {"chest pain", "shortness of breath"},
    {"stroke"},
    {"unconscious"},
    {"severe bleeding"},
    {"trouble speaking", "numbness"},
    {"facial drooping"},
]

# ─── Intent patterns ──────────────────────────────────────────────────────────

INTENT_PATTERNS: dict[str, list[str]] = {
    "greeting": [
        r"\b(hello|hi|hey|good morning|good afternoon|good evening)\b",
        r"\b(salom|assalomu|xayr|yaxshimisiz)\b",
    ],
    "appointment": [
        r"\b(appointment|book|schedule|visit|booking|reserve)\b",
        r"\b(qabulga|uchrashuv|yozilmoq|shifokorga bor|qabul)\b",
    ],
    "medication_info": [
        r"\b(medicine|medication|drug|pill|tablet|dose|dosage|prescription|antibiotic)\b",
        r"\b(dori|tabletkа|tabletka|doza|retsept|antibiotik|iste'mol)\b",
    ],
    "emergency": [
        r"\b(emergency|urgent|911|ambulance|help me|critical)\b",
        r"\b(tez yordam|shoshilinch|yordam bering|halokatli)\b",
    ],
    "general_info": [
        r"\b(what is|how to|explain|tell me|information|advice|tips|prevent)\b",
        r"\b(nima|qanday|tushuntiring|maslahat|ma'lumot|oldini olish)\b",
    ],
}

# ─── Response templates ───────────────────────────────────────────────────────

RESPONSES: dict[str, dict[str, str]] = {
    "greeting": {
        "en": (
            "Hello! I'm MedSmart AI, your personal medical assistant. "
            "I can help you understand symptoms, provide general health advice, "
            "and guide you to the right care. How can I help you today?"
        ),
        "uz": (
            "Assalomu alaykum! Men MedSmart AI tibbiy yordamchisiman. "
            "Simptomlaringizni tushunishga, umumiy sog'liq maslahatlarini berishga "
            "va to'g'ri tibbiy yordam olishga yo'naltirishga yordam bera olaman. "
            "Bugun qanday yordam kerak?"
        ),
    },
    "appointment": {
        "en": (
            "To book an appointment with a doctor through MedSmart:\n"
            "1. Log in to your MedSmart patient account.\n"
            "2. Go to the 'Doctors' section and select a specialist.\n"
            "3. Choose an available date and time.\n"
            "4. Confirm your booking — you'll receive a confirmation.\n\n"
            "Need help with anything else?"
        ),
        "uz": (
            "MedSmart orqali shifokorga qabulga yozilish uchun:\n"
            "1. MedSmart bemor hisobingizga kiring.\n"
            "2. 'Shifokorlar' bo'limiga o'ting va mutaxassisni tanlang.\n"
            "3. Bo'sh sana va vaqtni tanlang.\n"
            "4. Bronni tasdiqlang — tasdiqlash xabari keladi.\n\n"
            "Boshqa savol bormi?"
        ),
    },
    "medication_info": {
        "en": (
            "I can provide general information about medications, but please note: "
            "**always consult your doctor before starting, stopping, or changing any medication.** "
            "Self-medicating can be dangerous. What medication would you like to know about?"
        ),
        "uz": (
            "Dorilar haqida umumiy ma'lumot bera olaman, lekin esda tuting: "
            "**har qanday dorini boshlamoqchi, to'xtatmoqchi yoki o'zgartirmoqchi bo'lsangiz — avval shifokorga maslahatlashing.** "
            "O'z-o'zini davolash xavfli bo'lishi mumkin. Qaysi dori haqida bilmoqchisiz?"
        ),
    },
    "emergency": {
        "en": (
            "🚨 **EMERGENCY ALERT** 🚨\n\n"
            "Based on what you've described, this sounds like a medical emergency.\n"
            "**CALL EMERGENCY SERVICES NOW (103 / 112).**\n\n"
            "While waiting for help:\n"
            "• Stay calm and do not move if you suspect a spinal injury.\n"
            "• If the person is unconscious but breathing, place them in the recovery position.\n"
            "• If there is no pulse, begin CPR if trained to do so.\n"
            "• Do not leave the person alone.\n\n"
            "Please call emergency services immediately!"
        ),
        "uz": (
            "🚨 **SHOSHILINCH HOLAT** 🚨\n\n"
            "Siz ta'riflagan belgilar tibbiy favqulodda holat bo'lishi mumkin.\n"
            "**HOZIROQ TEZDORDAM CHAQIRING (103 / 112).**\n\n"
            "Yordam kelgunicha:\n"
            "• Sakin turing, umurtqa pog'onasi jarohati shubhasi bo'lsa — harakat qilmang.\n"
            "• Agar odam hushsiz lekin nafas olayotgan bo'lsa — yon holatga qo'ying.\n"
            "• Yurak urishi bo'lmasa va bilsangiz — YAM boshlang.\n"
            "• Yolg'iz qoldirmang.\n\n"
            "Iltimos, zudlik bilan tez yordam chaqiring!"
        ),
    },
    "general_info": {
        "en": (
            "That's a great health question. Here's some general guidance:\n"
            "• Maintain a balanced diet rich in fruits and vegetables.\n"
            "• Exercise at least 30 minutes a day, 5 days a week.\n"
            "• Get 7–9 hours of sleep each night.\n"
            "• Stay hydrated — drink at least 8 glasses of water daily.\n"
            "• Schedule regular check-ups with your doctor.\n\n"
            "For specific medical advice, please consult a healthcare professional."
        ),
        "uz": (
            "Bu yaxshi savol. Umumiy sog'liq bo'yicha bir nechta maslahat:\n"
            "• Meva va sabzavotlarga boy muvozanatli ovqatlaning.\n"
            "• Haftada 5 kun, kuniga kamida 30 daqiqa jismoniy mashq qiling.\n"
            "• Har kecha 7–9 soat uxlang.\n"
            "• Ko'p suv iching — kuniga kamida 8 stakan.\n"
            "• Shifokor bilan muntazam tekshiruv o'tkazing.\n\n"
            "Muayyan tibbiy maslahat uchun mutaxassis bilan maslahatlashing."
        ),
    },
}

SYMPTOM_RESPONSE_TEMPLATE: dict[str, str] = {
    "en": (
        "I've detected the following symptoms in your message: **{symptoms}**.\n\n"
        "These symptoms could be associated with conditions such as: {conditions}.\n\n"
        "**Recommendations:**\n"
        "{recommendations}\n\n"
        "⚠️ *This is general information only. Please consult a doctor for an accurate diagnosis.*"
    ),
    "uz": (
        "Xabaringizda quyidagi simptomlar aniqlandim: **{symptoms}**.\n\n"
        "Bu simptomlar quyidagi kasalliklar bilan bog'liq bo'lishi mumkin: {conditions}.\n\n"
        "**Tavsiyalar:**\n"
        "{recommendations}\n\n"
        "⚠️ *Bu faqat umumiy ma'lumot. Aniq tashxis uchun shifokorga murojaat qiling.*"
    ),
}

# symptom → possible conditions
SYMPTOM_CONDITIONS: dict[str, list[str]] = {
    "fever": ["Flu (Influenza)", "COVID-19", "Bacterial infection", "Malaria"],
    "headache": ["Tension headache", "Migraine", "Hypertension", "Dehydration"],
    "cough": ["Common cold", "Flu", "Bronchitis", "Asthma", "COVID-19"],
    "fatigue": ["Anemia", "Thyroid disorder", "Diabetes", "Depression", "Chronic fatigue"],
    "chest pain": ["Angina", "Heart attack", "Pulmonary embolism", "Costochondritis"],
    "shortness of breath": ["Asthma", "Pneumonia", "Heart failure", "Anxiety"],
    "nausea": ["Gastritis", "Food poisoning", "Pregnancy", "Migraine"],
    "vomiting": ["Gastroenteritis", "Food poisoning", "Appendicitis"],
    "dizziness": ["Low blood pressure", "Anemia", "Inner ear issue", "Dehydration"],
    "back pain": ["Muscle strain", "Herniated disc", "Kidney stone", "Osteoporosis"],
    "joint pain": ["Arthritis", "Gout", "Lupus", "Bursitis"],
    "sore throat": ["Strep throat", "Tonsillitis", "Common cold", "Mono"],
    "runny nose": ["Common cold", "Allergic rhinitis", "Flu", "Sinusitis"],
    "stomach pain": ["Gastritis", "Appendicitis", "IBS", "Food poisoning"],
    "diarrhea": ["Gastroenteritis", "IBS", "Food poisoning", "Crohn's disease"],
    "constipation": ["IBS", "Low fiber diet", "Dehydration", "Thyroid issues"],
    "rash": ["Allergic reaction", "Eczema", "Psoriasis", "Chickenpox"],
    "itching": ["Allergic reaction", "Eczema", "Dry skin", "Liver disease"],
    "swelling": ["Edema", "Infection", "Allergic reaction", "Heart or kidney issues"],
    "blurred vision": ["Diabetes", "Hypertension", "Eye strain", "Glaucoma"],
    "heart palpitations": ["Arrhythmia", "Anxiety", "Hyperthyroidism", "Anemia"],
    "numbness": ["Nerve compression", "Diabetes neuropathy", "Stroke", "MS"],
    "tingling": ["Nerve compression", "Diabetes", "Vitamin B12 deficiency"],
    "muscle pain": ["Flu", "Fibromyalgia", "Injury", "Viral infection"],
    "migraine": ["Migraine disorder", "Tension headache", "Hormonal changes"],
    "loss of appetite": ["Depression", "Infection", "Liver disease", "Cancer"],
    "insomnia": ["Anxiety", "Depression", "Sleep apnea", "Stress"],
    "anxiety": ["Generalized anxiety disorder", "Panic disorder", "Hyperthyroidism"],
    "depression": ["Major depressive disorder", "Bipolar disorder", "Thyroid issues"],
    "bleeding": ["Injury", "Coagulation disorder", "GI bleeding"],
}

# symptom → recommendations
SYMPTOM_RECOMMENDATIONS_EN: dict[str, str] = {
    "fever": "• Rest and stay hydrated.\n• Take paracetamol for fever reduction.\n• See a doctor if fever exceeds 39°C or lasts more than 3 days.",
    "headache": "• Rest in a quiet, dark room.\n• Stay hydrated.\n• Consult a doctor if headaches are frequent or severe.",
    "cough": "• Stay hydrated and use honey in warm water.\n• Avoid smoke and irritants.\n• See a doctor if cough persists beyond 2 weeks or includes blood.",
    "fatigue": "• Ensure 7–9 hours of sleep.\n• Get a blood test (CBC, thyroid, glucose).\n• Consult a doctor if fatigue is persistent.",
    "chest pain": "• Seek immediate medical attention if pain is crushing or radiating to arm/jaw.\n• Do not ignore chest pain — it can be serious.",
    "shortness of breath": "• Sit upright and try to stay calm.\n• Seek emergency care if sudden and severe.\n• See a doctor for evaluation.",
    "nausea": "• Eat small, bland meals.\n• Stay hydrated with sips of water.\n• See a doctor if nausea persists more than 2 days.",
    "vomiting": "• Rest your stomach for 1–2 hours, then sip clear fluids.\n• Avoid solid food until vomiting stops.\n• See a doctor if there is blood or it lasts more than 24 hours.",
    "dizziness": "• Sit or lie down immediately.\n• Stay hydrated.\n• See a doctor if dizziness is frequent or severe.",
    "default": "• Monitor your symptoms closely.\n• Rest and stay hydrated.\n• Consult a healthcare professional for proper evaluation.",
}

SYMPTOM_RECOMMENDATIONS_UZ: dict[str, str] = {
    "fever": "• Dam oling va ko'p suv iching.\n• Haroratni tushirish uchun paratsetamol oling.\n• Harorat 39°C dan oshsa yoki 3 kundan ko'p davom etsa — shifokorga boring.",
    "headache": "• Sokin, qorong'i xonada dam oling.\n• Ko'p suv iching.\n• Bosh og'rig'i tez-tez yoki kuchli bo'lsa — shifokorga murojaat qiling.",
    "cough": "• Ko'p suv iching, issiq suvga asal qo'shing.\n• Tutundan va ta'sirlantirishlardan saqlaning.\n• Yo'tal 2 haftadan ortiq davom etsa yoki qon bo'lsa — shifokorga boring.",
    "fatigue": "• 7–9 soat uxlashga harakat qiling.\n• Qon tahlili (UAK, qalqonsimon bez, qand) topshiring.\n• Charchash uzoq davom etsa — shifokorga murojaat qiling.",
    "chest pain": "• Og'riq ezuvchi yoki qo'l/jagga tarqalayotgan bo'lsa — zudlik bilan tibbiy yordam oling.\n• Ko'krak og'rig'ini e'tiborsiz qoldirmang — jiddiy bo'lishi mumkin.",
    "shortness of breath": "• To'g'ri o'tiring va tinchlanishga harakat qiling.\n• To'satdan va kuchli bo'lsa — tez yordam chaqiring.\n• Tekshiruv uchun shifokorga boring.",
    "default": "• Simptomlaringizni kuzating.\n• Dam oling va ko'p suv iching.\n• To'g'ri baholash uchun tibbiy xodimga murojaat qiling.",
}

# ─── Context-aware response helpers ───────────────────────────────────────────

def _extract_symptoms_from_history(history: list[dict]) -> set[str]:
    """Pull any previously detected symptoms from conversation history."""
    seen: set[str] = set()
    for turn in history:
        content = turn.get("content", "")
        if not content:
            continue
        # Check metadata embedded as JSON comment (if stored)
        # Also scan raw text for canonical symptom names
        for canonical in set(EN_SYMPTOMS.values()) | set(UZ_SYMPTOMS.values()):
            if canonical in content.lower():
                seen.add(canonical)
    return seen


# ─── MedicalChatEngine ────────────────────────────────────────────────────────

class MedicalChatEngine:
    """
    Rule-based medical NLP chat engine for MedSmart AI.
    No external LLM — all logic is deterministic and offline-capable.
    """

    def __init__(self) -> None:
        # Compile intent regexes once
        self._intent_re: dict[str, list[re.Pattern]] = {
            intent: [re.compile(p, re.IGNORECASE) for p in patterns]
            for intent, patterns in INTENT_PATTERNS.items()
        }

    # ── Public API ────────────────────────────────────────────────────────────

    def process(
        self,
        message: str,
        history: Optional[list[dict]] = None,
    ) -> dict:
        """
        Process a user message and return a response dict:
        {
            reply: str,
            metadata: {
                intent: str,
                symptoms_detected: list[str],
                emergency: bool,
                confidence: float,
                language: str,
            }
        }
        """
        if history is None:
            history = []

        lang = _detect_language(message)
        symptoms = self._detect_symptoms(message, lang)

        # Merge symptoms seen in previous context
        context_symptoms = _extract_symptoms_from_history(history)
        all_symptoms = symptoms | context_symptoms

        # Detect intent (emergency overrides everything)
        intent = self._detect_intent(message, symptoms, all_symptoms)

        emergency = self._is_emergency(all_symptoms, message)
        if emergency:
            intent = "emergency"

        confidence = self._confidence(intent, symptoms)
        reply = self._generate_reply(intent, symptoms, all_symptoms, lang, message)

        return {
            "reply": reply,
            "metadata": {
                "intent": intent,
                "symptoms_detected": sorted(list(symptoms)),
                "emergency": emergency,
                "confidence": round(confidence, 2),  # type: ignore[call-overload]
                "language": lang,
            },
        }

    # ── Internal helpers ──────────────────────────────────────────────────────

    def _detect_symptoms(self, message: str, lang: str) -> set[str]:
        """Return set of canonical symptom names found in the message."""
        found: set[str] = set()
        msg_lower = message.lower()

        # Check multi-word patterns first (longest first to avoid partial matches)
        combined = {**EN_SYMPTOMS, **UZ_SYMPTOMS}
        sorted_keys = sorted(combined.keys(), key=len, reverse=True)
        for keyword in sorted_keys:
            if keyword in msg_lower:
                found.add(combined[keyword])

        return found

    def _detect_intent(
        self,
        message: str,
        current_symptoms: set[str],
        all_symptoms: set[str],
    ) -> str:
        """Detect the primary intent of the message."""
        # If symptoms detected → symptom_check
        if current_symptoms:
            return "symptom_check"

        # Match regex patterns
        for intent, patterns in self._intent_re.items():
            for pattern in patterns:
                if pattern.search(message):
                    return intent

        # If context has symptoms and message is a follow-up question
        if all_symptoms and re.search(
            r"\b(what|how|should|can|do|tell|help|tavsiya|nima|qanday|qilishim)\b",
            message,
            re.IGNORECASE,
        ):
            return "symptom_check"

        return "general_info"

    def _is_emergency(self, symptoms: set[str], message: str) -> bool:
        """Return True if the symptom combination or message phrases indicate emergency."""
        # Direct emergency phrases
        emergency_phrases = [
            r"\b(heart attack|cardiac arrest|stroke|can't breathe|not breathing|"
            r"unconscious|passed out|severe bleeding|dying|call 911|call ambulance)\b",
            r"\b(yurak xuruj|tez yordam|hushini yo'qotdi|nafas olmayapti|o'lmoqda)\b",
        ]
        for phrase in emergency_phrases:
            if re.search(phrase, message, re.IGNORECASE):
                return True

        # Check known emergency combos
        for combo in EMERGENCY_COMBOS:
            if combo.issubset(symptoms):
                return True

        # Single critical symptoms
        critical = {"unconscious", "severe bleeding", "stroke", "facial drooping"}
        if critical & symptoms:
            return True

        return False

    def _generate_reply(
        self,
        intent: str,
        current_symptoms: set[str],
        all_symptoms: set[str],
        lang: str,
        original_message: str,
    ) -> str:
        """Generate a response string based on intent and symptoms."""

        if intent == "emergency":
            return RESPONSES["emergency"][lang]

        if intent == "symptom_check":
            return self._symptom_reply(current_symptoms, all_symptoms, lang)

        if intent in RESPONSES:
            return RESPONSES[intent][lang]

        # Fallback
        if lang == "uz":
            return (
                f"Xabaringiz qabul qilindi: \"{original_message[:80]}\". "  # type: ignore[index]
                "Aniqroq yordam uchun simptomlaringizni batafsil yozing "
                "yoki shifokorga murojaat qiling."
            )
        return (
            f"I received your message: \"{original_message[:80]}\". "  # type: ignore[index]
            "For more specific help, please describe your symptoms in detail "
            "or consult a healthcare professional."
        )

    def _symptom_reply(
        self,
        current_symptoms: set[str],
        all_symptoms: set[str],
        lang: str,
    ) -> str:
        """Build a symptom-check response."""
        symptoms_to_report = current_symptoms if current_symptoms else all_symptoms

        # Collect conditions for all detected symptoms
        conditions_set: list[str] = []
        for sym in symptoms_to_report:
            conditions_set.extend(SYMPTOM_CONDITIONS.get(sym, []))
        # De-duplicate, keep top 5
        seen_cond: list[str] = []
        for c in conditions_set:
            if c not in seen_cond:
                seen_cond.append(c)
        top_conditions = seen_cond[:5]  # type: ignore[index]

        # Get recommendations (first matching symptom wins for specifics)
        recs = None
        for sym in symptoms_to_report:
            if lang == "uz":
                recs = SYMPTOM_RECOMMENDATIONS_UZ.get(sym)
            else:
                recs = SYMPTOM_RECOMMENDATIONS_EN.get(sym)
            if recs:
                break
        if not recs:
            recs = SYMPTOM_RECOMMENDATIONS_UZ["default"] if lang == "uz" else SYMPTOM_RECOMMENDATIONS_EN["default"]

        sym_list = ", ".join(symptoms_to_report) if symptoms_to_report else "unspecified symptoms"
        cond_list = ", ".join(top_conditions) if top_conditions else ("Noma'lum" if lang == "uz" else "Unknown")

        template = SYMPTOM_RESPONSE_TEMPLATE[lang]
        return template.format(
            symptoms=sym_list,
            conditions=cond_list,
            recommendations=recs,
        )

    def _confidence(self, intent: str, symptoms: set[str]) -> float:
        """Simple heuristic confidence score 0.0–1.0."""
        if intent == "emergency":
            return 0.99
        if intent == "symptom_check":
            return min(0.5 + len(symptoms) * 0.1, 0.95)
        if intent == "greeting":
            return 0.90
        if intent == "appointment":
            return 0.85
        if intent == "medication_info":
            return 0.80
        return 0.60


# ─── Module-level singleton ───────────────────────────────────────────────────

chat_engine = MedicalChatEngine()
