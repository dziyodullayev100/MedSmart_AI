// MED SMART - Xavfsizlik tizimi
// Versiya: 1.0.0
// Muallif: MED SMART Development Team

// Xavfsizlik konfiguratsiyasi
const SECURITY_CONFIG = {
    // Parol siyosati
    password: {
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: false,
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000 // 15 daqiqa
    },
    
    // Sessiya konfiguratsiyasi
    session: {
        timeout: 30 * 60 * 1000, // 30 daqiqa
        refreshWarning: 5 * 60 * 1000, // 5 daqiqa oldin ogohlantirish
        maxConcurrentSessions: 1
    },
    
    // CSRF himoyasi
    csrf: {
        tokenLength: 32,
        expiration: 60 * 60 * 1000 // 1 soat
    }
};

// Xavfsizlik klassi
class SecurityManager {
    constructor() {
        this.failedAttempts = {};
        this.lockedAccounts = new Map();
        this.activeTokens = new Map();
        this.sessionTimeouts = new Map();
    }
    
    // Parolni tekshirish
    validatePassword(password) {
        const config = SECURITY_CONFIG.password;
        const errors = [];
        
        if (password.length < config.minLength) {
            errors.push(`Parol kamida ${config.minLength} belgidan iborat bo'lishi kerak`);
        }
        
        if (config.requireUppercase && !/[A-Z]/.test(password)) {
            errors.push("Parolda kamida bitta katta harf bo'lishi kerak");
        }
        
        if (config.requireLowercase && !/[a-z]/.test(password)) {
            errors.push("Parolda kamida bitta kichik harf bo'lishi kerak");
        }
        
        if (config.requireNumbers && !/\d/.test(password)) {
            errors.push("Parolda kamida bitta raqam bo'lishi kerak");
        }
        
        if (config.requireSpecialChars && !/[!@#$%^&*()_+=\-\[\]{};':"\\|,.<>\/?]/.test(password)) {
            errors.push("Parolda maxsus belgilar bo'lishi kerak");
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
    
    // Parolni xeshirlash (bcrypt o'rniga sodda hash)
    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return btoa(hash.toString());
    }
    
    // Login urinishlarini kuzatish
    trackFailedAttempt(username) {
        if (!this.failedAttempts[username]) {
            this.failedAttempts[username] = {
                count: 0,
                lastAttempt: null,
                lockedUntil: null
            };
        }
        
        const attempt = this.failedAttempts[username];
        attempt.count++;
        attempt.lastAttempt = Date.now();
        
        if (attempt.count >= SECURITY_CONFIG.password.maxAttempts) {
            const lockUntil = Date.now() + SECURITY_CONFIG.password.lockoutDuration;
            attempt.lockedUntil = lockUntil;
            this.lockedAccounts.set(username, lockUntil);
            
            // Tuzatilgan qator (Backticks qo'shildi):
            console.warn(`Foydalanuvchi ${username} bloklandi. Bloklanish vaqti: ${new Date(lockUntil).toLocaleString()}`);
            return false;
        }
        
        this.failedAttempts[username] = attempt;
        return true;
    }
    
    // Foydalanuvchi bloklanganligini tekshirish
    isAccountLocked(username) {
        const lockUntil = this.lockedAccounts.get(username);
        if (!lockUntil) return false;
        
        if (Date.now() > lockUntil) {
            this.lockedAccounts.delete(username);
            delete this.failedAttempts[username];
            return false;
        }
        
        return true;
    }
    
    // Login urinishlarini tozalash
    clearFailedAttempts(username) {
        delete this.failedAttempts[username];
        this.lockedAccounts.delete(username);
    }
    
    // CSRF token generatsiya qilish
    generateCSRFToken() {
        const token = Array.from(crypto.getRandomValues(new Uint8Array(SECURITY_CONFIG.csrf.tokenLength)))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        const tokenData = {
            token: token,
            createdAt: Date.now(),
            expiresAt: Date.now() + SECURITY_CONFIG.csrf.expiration
        };
        
        this.activeTokens.set(token, tokenData);
        return token;
    }
    
    // CSRF tokenni tekshirish
    validateCSRFToken(token) {
        const tokenData = this.activeTokens.get(token);
        if (!tokenData) return false;
        
        if (Date.now() > tokenData.expiresAt) {
            this.activeTokens.delete(token);
            return false;
        }
        
        return true;
    }
    
    // Eski tokenlarni tozalash
    cleanupExpiredTokens() {
        const now = Date.now();
        for (const [token, data] of this.activeTokens.entries()) {
            if (now > data.expiresAt) {
                this.activeTokens.delete(token);
            }
        }
    }
    
    // Sessiyani boshqarish
    refreshSession(userId) {
        const sessionData = {
            userId: userId,
            lastActivity: Date.now(),
            expiresAt: Date.now() + SECURITY_CONFIG.session.timeout
        };
        
        this.sessionTimeouts.set(userId, sessionData);
        localStorage.setItem('medsmart_session', JSON.stringify(sessionData));
        
        return sessionData;
    }
    
    // Sessiyani tekshirish
    validateSession(userId) {
        const session = this.sessionTimeouts.get(userId);
        if (!session) return false;
        
        const now = Date.now();
        const warningTime = session.expiresAt - SECURITY_CONFIG.session.refreshWarning;
        
        if (now > session.expiresAt) {
            this.sessionTimeouts.delete(userId);
            localStorage.removeItem('medsmart_session');
            return false;
        }
        
        if (now > warningTime) {
            console.warn('Sessiya yaqin tugaydi!');
            this.showSessionWarning();
        }
        
        return true;
    }
    
    // Sessiya tugayotganda ogohlantirish
    showSessionWarning() {
        const warning = document.createElement('div');
        warning.className = 'session-warning';
        warning.innerHTML = `
            <div class="warning-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>Sessiyangiz 5 daqiqa ichida tugaydi. Iltimos, ishingizni saqlang!</span>
                <button onclick="securityManager.refreshSession(getCurrentUserId())">Uzaytirish</button>
            </div>
        `;
        
        document.body.appendChild(warning);
        
        setTimeout(() => {
            warning.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            if (document.body.contains(warning)) {
                document.body.removeChild(warning);
            }
        }, 10000);
    }
    
    // XSS himoyasi - inputlarni tozalash
    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+\s*=/gi, '')
            .trim();
    }
    
    // SQL Injection himoyasi
    sanitizeSQL(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/['\\;']/g, '')
            
            .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b/gi, '')
            .trim();
    }
}

// Global xavfsizlik obyekti
const securityManager = new SecurityManager();

// --- NEW TOKEN MANAGER LOGIC ---
let currentAccessToken = null;

const tokenManager = {
    setAccessToken(token) { currentAccessToken = token; },
    getAccessToken() { return currentAccessToken; },
    getTokenExpiry(token) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return new Date(payload.exp * 1000);
        } catch (e) {
            return new Date(0);
        }
    },
    isTokenExpired(token) {
        if (!token) return true;
        return Date.now() >= this.getTokenExpiry(token).getTime();
    },
    willExpireSoon(token) {
        if (!token) return true;
        return (this.getTokenExpiry(token).getTime() - Date.now()) < 60000;
    },
    async refreshAccessToken() {
        const refreshToken = localStorage.getItem('medsmart_refresh_token');
        if (!refreshToken) {
            secureLogout();
            return false;
        }
        try {
            const baseUrl = window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:5000/api' : 'https://medsmart-backend.onrender.com/api');
            const response = await fetch(`${baseUrl}/users/refresh-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });
            const data = await response.json();
            
            if (!response.ok) throw new Error(data.message);
            
            currentAccessToken = data.accessToken || data.token;
            return true;
        } catch (error) {
            console.error('Token refresh failed:', error);
            secureLogout();
            window.location.href = '/'; 
            return false;
        }
    }
};

window.addEventListener('unload', () => {
    // Clear accessToken from memory on tab close
    currentAccessToken = null;
});

// Login funksiyasi bilan xavfsizlik integratsiyasi
async function secureLogin(username, password, rememberMe = false) {
    const cleanUsername = securityManager.sanitizeInput(username);
    
    if (securityManager.isAccountLocked(cleanUsername)) {
        throw new Error('Hisobingiz vaqtincha bloklangan. Iltimos, keyinroq urinib ko\'ring.');
    }
    
    try {
        const baseUrl = window.API_BASE_URL || ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.protocol === 'file:') ? 'http://localhost:5000/api' : 'https://medsmart-backend.onrender.com/api');
        const response = await fetch(`${baseUrl}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: cleanUsername, password: password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            securityManager.trackFailedAttempt(cleanUsername);
            throw new Error(data.message || 'Login yoki parol noto\'g\'ri!');
        }
        
        securityManager.clearFailedAttempts(cleanUsername);
        securityManager.refreshSession(cleanUsername);
        
        // Tokenlarni saqlash (NEW)
        if (data.accessToken || data.token) {
            tokenManager.setAccessToken(data.accessToken || data.token);
        }
        if (data.refreshToken) {
            localStorage.setItem('medsmart_refresh_token', data.refreshToken);
        }
        
        // Preserve backward compatibility
        if (data.token) {
            localStorage.setItem('medsmart_token', data.token);
        }
        
        return {
            success: true,
            user: {
                username: cleanUsername,
                role: data.role || 'user',
                loginTime: new Date().toISOString(),
                ...data
            }
        };
    } catch (error) {
        throw error;
    }
}

// Logout funksiyasi
function secureLogout() {
    const currentUserId = getCurrentUserId();
    if (currentUserId) {
        securityManager.sessionTimeouts.delete(currentUserId);
    }
    
    localStorage.removeItem('medsmart_session');
    localStorage.removeItem('medsmart_user');
    localStorage.removeItem('medsmart_token');
    localStorage.removeItem('medsmart_refresh_token');
    securityManager.activeTokens.clear();
    tokenManager.setAccessToken(null);
    
    console.log('Foydalanuvchi xavfsiz chiqarildi');
}

// Joriy foydalanuvchi ID sini olish
function getCurrentUserId() {
    const sessionData = localStorage.getItem('medsmart_session');
    if (sessionData) {
        try {
            const session = JSON.parse(sessionData);
            return session.userId;
        } catch (e) {
            return null;
        }
    }
    return null;
}

// Form submissionni xavfsizlashtirish
function secureFormSubmission(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const csrfToken = securityManager.generateCSRFToken();
    const csrfInput = document.createElement('input');
    csrfInput.type = 'hidden';
    csrfInput.name = 'csrf_token';
    csrfInput.value = csrfToken;
    form.appendChild(csrfInput);
    
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        if (input.type !== 'password') {
            input.value = securityManager.sanitizeInput(input.value);
        }
    });
    
    return true;
}

// Vaqtinchalik eski tokenlarni tozalash
setInterval(() => {
    securityManager.cleanupExpiredTokens();
}, 60000);

// Export qilish (brauzer va node muhiti uchun)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityManager, securityManager, secureLogin, secureLogout, tokenManager };
} else {
    window.tokenManager = tokenManager;
}







