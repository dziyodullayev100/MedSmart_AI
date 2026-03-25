/**
 * frontend/js/demoFlow.js
 * MedSmart Automated Demo Orchestrator
 */

class DemoFlow {
    constructor() {
        this.steps = [
            { target: '#email-input', action: 'type', value: 'admin@medsmart.uz', message: 'Tizimga Admin sifatida kirish' },
            { target: '#password-input', action: 'type', value: 'Demo1234!', message: 'Maxfiy raqam avtomatik terilmoqda' },
            { target: '#login-btn', action: 'click', message: 'Tizimga kirish...' },
            { target: '#dashboard-stats', action: 'highlight', message: 'Dashboard statistikasi', delay: 2000 },
            { target: '#patients-nav', action: 'click', message: 'Bemorlar ro\'yxatiga o\'tish', delay: 1000 },
            { target: '.open-patient-btn', action: 'click', message: 'Bemor profili va AI diagnostikasini ochish', delay: 2000 },
            { target: '#ai-predict-btn', action: 'click', message: 'AI yordamida prognozlashni boshlash', delay: 1500 },
            { target: '#ai-triage-results', action: 'highlight', message: 'AI natijalari va Triage xulosalari', delay: 3000 },
            { target: '#chat-widget-btn', action: 'click', message: 'MedSmart AI Assistant bilan xabarlashuv', delay: 2000 },
            { target: '#chat-input', action: 'type', value: 'Boshim juda qattiq og\'riyapti va isimayapman', message: 'Simptom kiritilmoqda' },
            { target: '#chat-send', action: 'click', message: 'Sun\'iy intellektga ma\'lumot uzatilmoqda', delay: 500 },
            { target: '#appointments-nav', action: 'click', message: 'Navbatlar va Kalendarni ko\'rish', delay: 4000 }
        ];
        
        this.currentStepIndex = 0;
        this.isActive = sessionStorage.getItem('medsmart_demo_mode') === 'true';

        if (this.isActive) {
            this.initDemoObserver();
        }
    }

    startDemo() {
        sessionStorage.setItem('medsmart_demo_mode', 'true');
        this.isActive = true;
        window.location.href = '/?demo=true'; // Trigger reload into demo mode
    }

    async resetDemo() {
        if (!window.apiClient) {
            console.error('API Client topilmadi');
            return;
        }
        
        try {
            window.apiClient.showToast('Demo ma\'lumotlari tozalanib, qayta yuklanmoqda...', 'info');
            const res = await window.apiClient.delete('/demo/reset');
            if (res && res.success) {
                window.apiClient.showToast('Demo tayyor!', 'success');
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch(e) {
            console.error(e);
        }
    }

    // Auto-executes upon page load if active
    initDemoObserver() {
        console.log('🎬 Demo Mode Active');
        
        // Render simple guided tooltip
        this.renderTourTooltip();

        // Specific Login Page autofill
        if (window.location.pathname.includes('login') || window.location.pathname === '/') {
            setTimeout(() => {
                const emailField = document.querySelector('input[type="email"]');
                const passField = document.querySelector('input[type="password"]');
                if (emailField && passField) {
                    emailField.value = 'admin@medsmart.uz';
                    passField.value = 'Demo1234!';
                    this.showTooltip('Demo ma\'lumotlari avtomatik kiritildi');
                }
            }, 500);
        }
    }

    showTooltip(text) {
        let tt = document.getElementById('demo-tooltip');
        if (!tt) this.renderTourTooltip();
        tt = document.getElementById('demo-tooltip');
        tt.innerText = '🎥 DEMO: ' + text;
        tt.style.display = 'block';
    }

    renderTourTooltip() {
        const div = document.createElement('div');
        div.id = 'demo-tooltip';
        div.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.85); color: #00d2ff; padding: 12px 24px;
            border-radius: 30px; border: 1px solid #00d2ff; font-weight: bold;
            z-index: 999999; box-shadow: 0 5px 20px rgba(0,210,255,0.4);
            pointer-events: none; text-align: center;
        `;
        div.innerText = '🎥 MedSmart Demo Started';
        document.body.appendChild(div);
    }
}

const demoControl = new DemoFlow();

// Expose Globals
window.startDemo = () => demoControl.startDemo();
window.resetDemo = () => demoControl.resetDemo();

// Check URL query strictly
if (window.location.search.includes('demo=true')) {
    if (!demoControl.isActive) demoControl.startDemo();
}
