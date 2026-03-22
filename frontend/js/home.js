// MED SMART - Asosiy JavaScript fayli
// Versiya: 1.0.0
// Muallif: MED SMART Development Team

// Global o'zgaruvchilar
const MED_SMART = {
    // Konfiguratsiya
    config: {
        apiBaseUrl: '/api',
        version: '1.0.0',
        appName: 'MED SMART',
        animationDuration: 300,
        debounceDelay: 300
    },
    
    // Foydalanuvchi ma'lumotlari
    user: {
        isLoggedIn: false,
        role: null, // 'admin' | 'bemor' | null
        data: null
    },
    
    // Sahifa holati
    state: {
        loading: false,
        currentSection: null,
        mobileMenuOpen: false
    }
};

// Utility funksiyalar
const Utils = {
    // Element tanlash
    $(selector) {
        return document.querySelector(selector);
    },
    
    // Barcha elementlarni tanlash
    $$(selector) {
        return document.querySelectorAll(selector);
    },
    
    // Tasodifiy ID generatsiya qilish
    generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    },
    
    // Sanani formatlash
    formatDate(date) {
        return new Date(date).toLocaleDateString('uz-UZ', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    // Debounce funksiyasi
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // Xatoliklarni ko'rsatish
    showError(message, element = null) {
        console.error('MED SMART Error:', message);
        if (element) {
            element.classList.add('error');
            element.title = message;
        }
    },
    
    // Muvaffaqiyatni ko'rsatish
    showSuccess(message) {
        console.log('MED SMART Success:', message);
        // Toast notification qo'shish mumkin
        this.showToast(message, 'success');
    },
    
    // Toast notification
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
};

// LocalStorage bilan ishlash
const Storage = {
    // Ma'lumotni saqlash
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            Utils.showError('LocalStorage ga saqlashda xatolik: ' + error.message);
            return false;
        }
    },
    
    // Ma'lumotni olish
    get(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            Utils.showError('LocalStorage dan olishda xatolik: ' + error.message);
            return null;
        }
    },
    
    // Ma'lumotni o'chirish
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            Utils.showError('LocalStorage dan o\'chirishda xatolik: ' + error.message);
            return false;
        }
    },
    
    // Barcha ma'lumotni tozalash
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            Utils.showError('LocalStorage ni tozalashda xatolik: ' + error.message);
            return false;
        }
    }
};

// Mobil menyu boshqaruvi
function toggleMobileMenu() {
    const mobileMenu = Utils.$('#mobileMenu');
    if (mobileMenu) {
        MED_SMART.state.mobileMenuOpen = !MED_SMART.state.mobileMenuOpen;
        mobileMenu.classList.toggle('active');
        
        // Body ga scroll ni bloklash
        document.body.style.overflow = MED_SMART.state.mobileMenuOpen ? 'hidden' : '';
    }
}

// Sahifa yuklanishi
function initializeApp() {
    console.log('MED SMART v' + MED_SMART.config.version + ' ishga tushdi...');
    
    // Foydalanuvchi ma'lumotlarini tekshirish
    checkUserSession();
    
    // Event listenerlarni o'rnatish
    setupEventListeners();
    
    // Animatsiyalarni boshlash
    initializeAnimations();

    // Slayderlarni ishga tushirish
    initializeSliders();
    
    // Xizmatlarni yuklash va chizish
    loadAndRenderServices();
    
    Utils.showSuccess('Ilova muvaffaqiyatli yuklandi!');
}

// Xizmatlarni dynamically yuklash
function loadAndRenderServices() {
    let services = Storage.get('xizmatlar');
    
    // Agar xizmatlar topilmasa, default xizmatlarni o'rnatamiz
    if (!services || services.length === 0) {
        services = [
            { id: 1, nomi: "Umumiy shifokor qabuli", narx: 100000, mutaxassis: "Terapevt", davomiylik: "30 daq", seanslar: "1 seans", ikona: "fas fa-stethoscope", status: "faol" },
            { id: 2, nomi: "Pediatr konsultatsiyasi", narx: 120000, mutaxassis: "Pediatr", davomiylik: "30 daq", seanslar: "1 seans", ikona: "fas fa-baby", status: "faol" },
            { id: 3, nomi: "Ginekolog konsultatsiyasi", narx: 150000, mutaxassis: "Ginekolog", davomiylik: "40 daq", seanslar: "1 seans", ikona: "fas fa-female", status: "faol" },
            { id: 4, nomi: "Kardiolog konsultatsiyasi", narx: 180000, mutaxassis: "Kardiolog", davomiylik: "30 daq", seanslar: "1 seans", ikona: "fas fa-heartbeat", status: "faol" },
            { id: 5, nomi: "Nevrolog konsultatsiyasi", narx: 160000, mutaxassis: "Nevrolog", davomiylik: "30 daq", seanslar: "1 seans", ikona: "fas fa-brain", status: "faol" },
            { id: 6, nomi: "Stomatolog tekshiruvi", narx: 120000, mutaxassis: "Stomatolog", davomiylik: "20-30 daq", seanslar: "1 seans", ikona: "fas fa-tooth", status: "faol" },
            { id: 7, nomi: "Oftalmolog tekshiruvi", narx: 140000, mutaxassis: "Oftalmolog", davomiylik: "25 daq", seanslar: "1 seans", ikona: "fas fa-eye", status: "faol" },
            { id: 8, nomi: "Dermatolog konsultatsiyasi", narx: 130000, mutaxassis: "Dermatolog", davomiylik: "30 daq", seanslar: "1 seans", ikona: "fas fa-allergies", status: "faol" },
            { id: 9, nomi: "USM tekshiruvi", narx: 250000, mutaxassis: "USM mutaxassisi", davomiylik: "20-30 daq", seanslar: "1 seans", ikona: "fas fa-wave-square", status: "faol" },
            { id: 10, nomi: "EKG tekshiruvi", narx: 150000, mutaxassis: "Kardiolog", davomiylik: "15-20 daq", seanslar: "1 seans", ikona: "fas fa-heartbeat", status: "faol" },
            { id: 11, nomi: "Qon tahlillari", narx: 80000, mutaxassis: "Laboratoriya mutaxassisi", davomiylik: "15 daq", seanslar: "1 seans", ikona: "fas fa-microscope", status: "faol" },
            { id: 12, nomi: "Siydik tahlili", narx: 60000, mutaxassis: "Laboratoriya mutaxassisi", davomiylik: "10 daq", seanslar: "1 seans", ikona: "fas fa-vial", status: "faol" }
        ];
        Storage.set('xizmatlar', services);
    }
    
    // Faqat faol xizmatlar ko'rsatiladi
    const activeServices = services.filter(s => s.status === 'faol');
    
    const mainGrid = Utils.$('#mainServiceGrid');
    const modalGrid = Utils.$('#mainModalGrid');
    
    if (mainGrid) {
        // Asosiy ekranda faqat dastlabki 12 tasini ko'rsatamiz
        const topServices = activeServices.slice(0, 12);
        mainGrid.innerHTML = topServices.map(s => `
            <div class="card">
                <div class="icon"><i class="${s.ikona || 'fas fa-stethoscope'}"></i></div>
                <span class="label">${s.nomi}</span>
            </div>
        `).join('');
    }
    
    if (modalGrid) {
        // Modal ichida barchasini ko'rsatamiz
        modalGrid.innerHTML = activeServices.map(s => `
            <div class="card">
                <div class="icon"><i class="${s.ikona || 'fas fa-stethoscope'}"></i></div>
                <span>${s.nomi}</span>
            </div>
        `).join('');
    }
}

// Foydalanuvchi sessiyasini tekshirish
function checkUserSession() {
    const userData = Storage.get('medsmart_user');
    if (userData) {
        MED_SMART.user = userData;
        console.log('Foydalanuvchi tizimga kirgan:', userData.role);
    }
}

// Event listenerlarni o'rnatish
function setupEventListeners() {
    // Mobil menyu tugmasi
    const mobileToggle = Utils.$('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }
    
    // Sahifadan tashqarida bosilganda mobil menyuni yopish
    document.addEventListener('click', (e) => {
        const mobileMenu = Utils.$('#mobileMenu');
        const mobileToggle = Utils.$('.mobile-menu-toggle');
        
        if (mobileMenu && !mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
            if (MED_SMART.state.mobileMenuOpen) {
                toggleMobileMenu();
            }
        }
    });
    
    // Smooth scroll for navigation links
    Utils.$$('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = Utils.$(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Header scroll effekti
    window.addEventListener('scroll', Utils.debounce(function() {
        const header = Utils.$('.header');
        if (header) {
            if (window.scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'var(--shadow-md)';
            }
        }
    }, MED_SMART.config.debounceDelay));

    // Modal functionality
    const openModalBtn = Utils.$('#openModal');
    const servicesModal = Utils.$('#servicesModal');
    const modalClose = Utils.$('.close');
    
    if (openModalBtn && servicesModal) {
        openModalBtn.addEventListener('click', function() {
            servicesModal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Fonni skroll qilishni to'xtatish
            servicesModal.scrollTop = 0;
            setTimeout(() => servicesModal.classList.add('show'), 10);
        });
    }
    
    if (modalClose && servicesModal) {
        modalClose.addEventListener('click', function() {
            servicesModal.classList.remove('show');
            document.body.style.overflow = ''; // Asl holatga qaytarish
            setTimeout(() => servicesModal.style.display = 'none', 300);
        });
    }
    
    document.addEventListener('click', function(event) {
        if (event.target === servicesModal) {
            servicesModal.classList.remove('show');
            document.body.style.overflow = ''; // Asl holatga qaytarish
            setTimeout(() => servicesModal.style.display = 'none', 300);
        }
    });

    // ScrollSpy - Aktiv menyuni belgilash
    const sections = Utils.$$('section, .footer-box.address'); 
    const navLinks = Utils.$$('.menu li a[href^="#"]');

    window.addEventListener('scroll', Utils.debounce(() => {
        let current = '';
        const viewportMiddle = window.innerHeight / 3; 

        const addressElement = Utils.$('#address');
        if (addressElement) {
            const rect = addressElement.getBoundingClientRect();
            if (rect.top <= window.innerHeight / 2 && rect.bottom >= 0) {
                current = 'address';
            }
        }

        sections.forEach(section => {
            const rect = section.getBoundingClientRect();
            if (rect.top <= viewportMiddle && rect.bottom >= 100) {
                const id = section.getAttribute('id');
                if (id) current = id;
            }
        });

        if ((window.innerHeight + Math.round(window.scrollY)) >= document.body.offsetHeight - 100) {
            current = 'contact'; 
        }

        if (current) {
            navLinks.forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${current}`) {
                    link.classList.add('active');
                }
            });
        }
    }, 50));

    // Empty links prevention
    Utils.$$('a[href="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
        });
    });
}

// Animatsiyalarni boshlash
function initializeAnimations() {
    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);
    
    // Animatsiya qilinadigan elementlarni kuzatish
    const animatedElements = Utils.$$('.animate-on-scroll');
    animatedElements.forEach(el => observer.observe(el));
}

// Slayderlarni boshqarish
function initializeSliders() {
    const sliders = Utils.$$('.slider');
    
    sliders.forEach(slider => {
        const slidesContainer = slider.querySelector('.slides');
        if (!slidesContainer) return;
        
        let slideIndex = 0;
        const slides = slidesContainer.querySelectorAll('img');
        const maxIndex = slides.length - 1;
        
        if (slides.length <= 1) return;
        
        // Next btn
        const nextBtn = document.createElement('button');
        nextBtn.className = 'slider-btn next-btn';
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        
        // Prev btn
        const prevBtn = document.createElement('button');
        prevBtn.className = 'slider-btn prev-btn';
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        
        slider.appendChild(prevBtn);
        slider.appendChild(nextBtn);
        
        // Dots
        const dotsContainer = document.createElement('div');
        dotsContainer.className = 'slider-dots';
        slides.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.className = index === 0 ? 'dot active' : 'dot';
            dot.addEventListener('click', () => goToSlide(index));
            dotsContainer.appendChild(dot);
        });
        slider.appendChild(dotsContainer);
        
        function updateSlider() {
            slidesContainer.style.transform = `translateX(-${slideIndex * 100}%)`;
            
            const dots = dotsContainer.querySelectorAll('.dot');
            dots.forEach((dot, index) => {
                dot.classList.toggle('active', index === slideIndex);
            });
        }
        
        function nextSlide() {
            slideIndex = slideIndex >= maxIndex ? 0 : slideIndex + 1;
            updateSlider();
        }
        
        function prevSlide() {
            slideIndex = slideIndex <= 0 ? maxIndex : slideIndex - 1;
            updateSlider();
        }
        
        function goToSlide(index) {
            slideIndex = index;
            updateSlider();
        }
        
        nextBtn.addEventListener('click', nextSlide);
        prevBtn.addEventListener('click', prevSlide);
        
        // Auto slide
        let autoSlideInterval = setInterval(nextSlide, 5000);
        
        slider.addEventListener('mouseenter', () => clearInterval(autoSlideInterval));
        slider.addEventListener('mouseleave', () => {
            autoSlideInterval = setInterval(nextSlide, 5000);
        });
    });
}

// Modal oynani boshqarish
function openModal(modalId) {
    const modal = Utils.$(`#${modalId}`);
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
        }, 10);
        
        // Focus ni modalga o'tkazish
        const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (firstFocusable) {
            firstFocusable.focus();
        }
    }
}

// Modal oynani yopish
function closeModal(modalId) {
    const modal = Utils.$(`#${modalId}`);
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Chiqish funksiyasi
function logout() {
    if (confirm('Siz tizimdan chiqishni xohlaysizmi?')) {
        Storage.remove('medsmart_user');
        MED_SMART.user = {
            isLoggedIn: false,
            role: null,
            data: null
        };
        
        Utils.showSuccess('Siz tizimdan muvaffaqiyatli chiqdingiz!');
        
        // Asosiy sahifaga yo'naltirish
        setTimeout(() => {
            window.location.href = './index.html';
        }, 1500);
    }
}

// Sahifa yuklanishi tugaganda
document.addEventListener('DOMContentLoaded', initializeApp);

// Export qilish (boshqa fayllarda ishlash uchun)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MED_SMART, Utils, Storage };
}