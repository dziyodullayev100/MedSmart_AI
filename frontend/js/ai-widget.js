// Floating AI Widget for MedSmart
document.addEventListener('DOMContentLoaded', () => {
  // Widget Container yaratish
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'medsmart-ai-widget';
  
  // Widget HTML & CSS (Ichiga o'rnatilgan)
  widgetContainer.innerHTML = `
    <style>
      #medsmart-ai-widget {
        position: fixed;
        bottom: 30px;
        right: 30px;
        z-index: 9999;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      }
      .ai-chat-btn {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #10b981;
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4);
        display: flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        border: none;
        outline: none;
      }
      .ai-chat-btn:hover {
        transform: scale(1.1) rotate(5deg);
      }
      .ai-chat-btn i {
        color: white;
        font-size: 30px;
      }
      .ai-chat-window {
        position: absolute;
        bottom: 85px;
        right: 0;
        width: 380px;
        height: 550px;
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 15px 40px rgba(0,0,0,0.25);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        transform: scale(0);
        transform-origin: bottom right;
        transition: transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        opacity: 0;
      }
      .ai-chat-window.open {
        transform: scale(1);
        opacity: 1;
      }
      .ai-chat-header {
        background: linear-gradient(90deg, #1a237e, #283593);
        color: white;
        padding: 15px 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .ai-chat-header-info {
        display: flex;
        align-items: center;
        gap: 15px;
      }
      .ai-chat-header-info .avatar {
        width: 45px; height: 45px; border-radius: 50%; 
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
        display: flex; align-items: center; justify-content: center; font-size: 1.4rem;
        border: 2px solid rgba(255,255,255,0.3);
      }
      .ai-chat-header-info h4 { margin: 0; font-size: 17px; font-weight: 700; background: linear-gradient(45deg, #8c9eff, #536dfe); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .ai-chat-header-info p { margin: 0; font-size: 12px; color: #c5cae9; }
      .ai-chat-close { background: none; border: none; color: white; font-size: 26px; cursor: pointer; opacity: 0.8; transition: 0.2s; }
      .ai-chat-close:hover { opacity: 1; transform: scale(1.1); }
      .ai-chat-body {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        background: linear-gradient(135deg, #f8f9ff 0%, #eef2ff 100%);
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      .ai-msg { max-width: 82%; padding: 14px 18px; border-radius: 20px; font-size: 15px; line-height: 1.5; word-wrap: break-word; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
      .ai-msg-bot { background: rgba(255,255,255,0.95); border: 1px solid rgba(140, 158, 255, 0.2); align-self: flex-start; border-bottom-left-radius: 5px; color: #333;}
      .ai-msg-user { background: linear-gradient(90deg, #667eea, #764ba2); color: white; align-self: flex-end; border-bottom-right-radius: 5px; }
      .ai-chat-input-area {
        padding: 15px 20px;
        background: rgba(255,255,255,0.95);
        border-top: 1px solid rgba(140, 158, 255, 0.2);
        display: flex;
        gap: 12px;
      }
      .ai-chat-input-area input {
        flex: 1; padding: 12px 18px; background: #f8f9ff; border: 1px solid rgba(140, 158, 255, 0.2); border-radius: 25px; outline: none; font-size: 15px; transition: 0.3s;
      }
      .ai-chat-input-area input:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2);
      }
      .ai-chat-input-area button {
        background: linear-gradient(90deg, #667eea, #764ba2); color: white; border: none; width: 45px; height: 45px; border-radius: 50%; cursor: pointer;
        display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.2s;
      }
      .ai-chat-input-area button:hover { transform: scale(1.1); }
      
      /* Dots animation for generic loading */
      .typing-indicator { display: flex; gap: 4px; padding: 5px 10px; }
      .typing-indicator span { width: 8px; height: 8px; background: #667eea; border-radius: 50%; animation: blink 1.4s infinite both; }
      .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
      .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes blink { 0% { opacity: 0.2; transform: scale(0.8); } 20% { opacity: 1; transform: scale(1); } 100% { opacity: 0.2; transform: scale(0.8); } }
    </style>
    
    <!-- Dumaloq chaqiruv tugmasi -->
    <button class="ai-chat-btn" id="aiChatToggle">
      <i class="fas fa-robot"></i>
    </button>
    
    <!-- Chat Oynasi -->
    <div class="ai-chat-window" id="aiChatWindow">
      <div class="ai-chat-header">
        <div class="ai-chat-header-info">
          <div class="avatar"><i class="fas fa-robot"></i></div>
          <div>
            <h4>MedSmart AI</h4>
            <p>Onlayn yordamchi (Beta)</p>
          </div>
        </div>
        <button class="ai-chat-close" id="aiChatClose">&times;</button>
      </div>
      <div class="ai-chat-body" id="aiChatBody">
        <div class="ai-msg ai-msg-bot">Salom! Men MedSmart sun'iy intellekt yordamchisiman. Sizga qanday yordam bera olaman? Men tibbiy tarixingiz asosida kelajakdagi xavflarni tahlil qilish imkoniyatiga egaman.</div>
      </div>
      <div class="ai-chat-input-area">
        <input type="text" id="aiChatInput" placeholder="Xabaringizni yozing..." />
        <button id="aiChatSend"><i class="fas fa-paper-plane"></i></button>
      </div>
    </div>
  `;
  document.body.appendChild(widgetContainer);

  const toggleBtn = document.getElementById('aiChatToggle');
  const closeBtn = document.getElementById('aiChatClose');
  const chatWindow = document.getElementById('aiChatWindow');
  const sendBtn = document.getElementById('aiChatSend');
  const chatInput = document.getElementById('aiChatInput');
  const chatBody = document.getElementById('aiChatBody');

  // Oynani ochish/yopish 
  toggleBtn.addEventListener('click', () => {
    chatWindow.classList.toggle('open');
    if (chatWindow.classList.contains('open')) {
      chatInput.focus();
    }
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('open');
  });

  // Xabarni UI ga joylash funksiyasi
  const appendMessage = (text, sender) => {
    const msgDiv = document.createElement('div');
    msgDiv.className = `ai-msg ${sender === 'user' ? 'ai-msg-user' : 'ai-msg-bot'}`;
    msgDiv.textContent = text;
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  };
  
  // Kutish animatsiyasi
  const showTypingIndicator = () => {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'ai-msg ai-msg-bot typing';
    msgDiv.innerHTML = '<div class="typing-indicator"><span></span><span></span><span></span></div>';
    msgDiv.id = 'typing-elem';
    chatBody.appendChild(msgDiv);
    chatBody.scrollTop = chatBody.scrollHeight;
  };
  
  const removeTypingIndicator = () => {
    const el = document.getElementById('typing-elem');
    if(el) el.remove();
  }

  // Jo'natish jarayoni
  const handleSend = async () => {
    const text = chatInput.value.trim();
    if(!text) return;
    
    appendMessage(text, 'user');
    chatInput.value = '';
    
    showTypingIndicator();

    // Keyinchalik /api/ai/disease-progression va /api/ai/seasonal-prediction ga so'rov jo'natish:
    setTimeout(async () => {
      removeTypingIndicator();
      let response = "Tibbiy tarixingiz tahlil qilinmoqda, natijani tez orada etkazaman.";
      
      try {
        if(text.toLowerCase().includes('bashorat') || text.toLowerCase().includes('kasallik')) {
           // Asl API orqali test qilish 
           /* 
           // Fallback if window.API_BASE_URL is missing
           const baseUrl = window.API_BASE_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:' ? 'http://localhost:5000/api' : 'https://med-smart-backend.onrender.com/api');
           
           const req = await fetch(`${baseUrl}/ai/disease-progression`, {
               // body params
           });
           const data = await req.json();
           response = data.message || "Tahlil natijalari tayyor";
           */
           response = "Bashorat natijasi: Sizning tibbiy tarixingiz asosida qish mavsumida ehtiyotkorligingizni oshirish tavsiya etiladi.";
        } else if(text.toLowerCase().includes('salom')) {
          response = "Assalomu alaykum! Sizga qanday yordam ko'rsata olaman?";
        } else if(text.toLowerCase().includes('rahmat')) {
          response = "Sog' bo'ling! MedSmart har doim yordamga shay.";
        } else {
             response = "Sizning xabaringiz tizimga qayd etildi. To'liq tibbiy xizmat uchun xizmatlar bo'limidan foydalaning.";
        }
      } catch (err) {
        response = "Serverda vaqtinchalik muammo mavjud.";
      }
      
      appendMessage(response, 'bot');
    }, 1200);
  };

  sendBtn.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') handleSend();
  });
});
