// script.js

document.addEventListener('DOMContentLoaded', function() {
    
    // --- I18N & LANGUAGE SWITCHER ---
    const supportedLangs = ['es', 'en', 'ro'];
    let currentLang = 'es'; // Default language

    const setLanguage = (lang) => {
        if (!supportedLangs.includes(lang)) {
            lang = 'es'; // Fallback to Spanish
        }
        currentLang = lang;
        localStorage.setItem('weddingLang', lang);
        document.documentElement.lang = lang;

        const langStrings = translations[lang];

        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (langStrings[key]) {
                // Use innerHTML for keys that might contain <br> tags
                if (key === 'rsvpIntro') {
                    el.innerHTML = langStrings[key];
                } else {
                    el.textContent = langStrings[key];
                }
            }
        });
        
        document.querySelectorAll('[data-translate-alt]').forEach(el => {
            const key = el.dataset.translateAlt;
            if (langStrings[key]) {
                el.alt = langStrings[key];
            }
        });

        // Update active button style
        document.querySelectorAll('#language-switcher button').forEach(button => {
            button.classList.toggle('active', button.dataset.lang === lang);
        });
    };

    const languageSwitcher = document.getElementById('language-switcher');
    if (languageSwitcher) {
        languageSwitcher.addEventListener('click', (e) => {
            if (e.target.tagName === 'BUTTON') {
                const lang = e.target.getAttribute('data-lang');
                setLanguage(lang);
            }
        });
    }
    
    // Determine initial language
    const savedLang = localStorage.getItem('weddingLang');
    const browserLang = navigator.language.split('-')[0];
    const initialLang = savedLang || (supportedLangs.includes(browserLang) ? browserLang : 'es');
    setLanguage(initialLang);

    // --- General Page Setup ---
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    const attendingSelect = document.getElementById('attending');
    const guestsWrapper = document.getElementById('guests-wrapper');
    const dietWrapper = document.getElementById('dietaryRestrictions-wrapper');
    const songWrapper = document.getElementById('song-wrapper');
    const guestsInput = document.getElementById('guests');

    if (attendingSelect && guestsWrapper && guestsInput) {
        const toggleFormFields = () => {
             if (attendingSelect.value === 'Sí') {
                guestsWrapper.style.display = 'block';
                dietWrapper.style.display = 'block';
                songWrapper.style.display = 'block';
                guestsInput.value = guestsInput.value === '0' ? '1' : guestsInput.value;
                guestsInput.min = '1';
            } else {
                guestsWrapper.style.display = 'none';
                dietWrapper.style.display = 'none';
                songWrapper.style.display = 'none';
                guestsInput.value = '0';
                guestsInput.min = '0';
            }
        };
        
        // Initial check and hide
        guestsWrapper.style.display = 'none';
        dietWrapper.style.display = 'none';
        songWrapper.style.display = 'none';
        
        attendingSelect.addEventListener('change', toggleFormFields);
    }

    // --- Custom Google Form Submission ---
    const rsvpForm = document.getElementById('customRsvpForm');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submitRsvpButton');
    let isSubmitting = false;

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function (e) {
            e.preventDefault(); 
            if (isSubmitting) return;
            isSubmitting = true;
            
            const formActionURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfeosnC-Ccddo4jXWHGtjBvNQ6l_EYRRwCg8OjUK0PeNZ5dtA/formResponse';
            const formData = new FormData(rsvpForm);
            
            if(submitButton) submitButton.disabled = true;
            if(submitButton) submitButton.textContent = translations[currentLang].formStatusSending;
            if(formStatus) formStatus.textContent = '';

            fetch(formActionURL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' 
            })
            .then(() => {
                if(formStatus) formStatus.textContent = translations[currentLang].formStatusSuccess;
                if(formStatus) formStatus.style.color = 'green';
                if(submitButton) submitButton.textContent = translations[currentLang].formStatusSent;
                rsvpForm.reset(); 
                // Hide fields again after reset
                if (guestsWrapper) guestsWrapper.style.display = 'none';
                if (dietWrapper) dietWrapper.style.display = 'none';
                if (songWrapper) songWrapper.style.display = 'none';
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                if(formStatus) formStatus.textContent = translations[currentLang].formStatusError;
                if(formStatus) formStatus.style.color = 'red'; 
                if(submitButton) submitButton.textContent = translations[currentLang].formSubmitButton;
                if(submitButton) submitButton.disabled = false;
            })
            .finally(() => {
                isSubmitting = false;
            });
        });
    }

    // --- Countdown Timer ---
    const weddingDate = new Date("2025-12-28T11:30:00").getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            const countdownEl = document.getElementById("countdown");
            if (countdownEl) {
                countdownEl.innerHTML = `<h3 class="font-script text-4xl text-zinc-800" data-translate-key="countdownEnded">${translations[currentLang].countdownEnded}</h3>`;
            }
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        if (document.getElementById("days")) document.getElementById("days").textContent = days.toString().padStart(2, '0');
        if (document.getElementById("hours")) document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
        if (document.getElementById("minutes")) document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
        if (document.getElementById("seconds")) document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
    };

    const countdownInterval = setInterval(updateCountdown, 1000);
    updateCountdown(); // Initial call

    // --- Animations and Effects ---
    AOS.init({
        duration: 800,
        once: true,
    });

    function launchConfetti() {
        const duration = 1000;
        const animationEnd = Date.now() + duration;
        const colors = ['#e5e7eb', '#a3a3a3', '#525252', '#800000'];

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);

            const particleCount = 50 * (timeLeft / duration);
            confetti({ particleCount, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
            confetti({ particleCount, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
        }, 250);
    }
    
    launchConfetti();
    console.log("Website script loaded and multi-language handler is active.");
});