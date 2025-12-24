document.addEventListener('DOMContentLoaded', function() {
    
    AOS.init({ duration: 800, once: true });

    // --- LANGUAGE HANDLER ---
    let currentLang = localStorage.getItem('weddingLang') || 'es';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('weddingLang', lang);
        
        const langStrings = translations[lang];

        // Translate Text Content
        document.querySelectorAll('[data-translate-key]').forEach(el => {
            const key = el.dataset.translateKey;
            if (langStrings[key]) el.innerHTML = langStrings[key];
        });

        // Translate Placeholders
        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.dataset.translatePlaceholder;
            if (langStrings[key]) el.placeholder = langStrings[key];
        });

        // Update Button Active State
        document.querySelectorAll('#language-switcher button').forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('font-bold', 'bg-zinc-100');
            } else {
                btn.classList.remove('font-bold', 'bg-zinc-100');
            }
        });

        // Update Button Text if in "Update" mode
        const submitBtn = document.getElementById('submitVote');
        const hintText = document.getElementById('edit-hint');
        if (!hintText.classList.contains('hidden')) {
             submitBtn.textContent = langStrings.btnUpdate;
        } else {
             submitBtn.textContent = langStrings.btnSubmit;
        }
    }

    // Initialize Language
    setLanguage(currentLang);

    // Language Button Click Events
    document.querySelectorAll('#language-switcher button').forEach(btn => {
        btn.addEventListener('click', () => setLanguage(btn.dataset.lang));
    });


    // --- 1. GUEST LIST ---
    const guests = [
        "Sebastian Tacuri", "Adriana Carrabs", "Agustin Nicolas Distefano Ferreira", "Agustina Díaz",
        "Amanda Burgos", "Amrit Triviño", "Andrei Bianca Stefania", "Andrei Zoicas",
        "Ángela Abigail García López", "Aulê Barbosa", "Blanca Guillen", "Christian Barrios",
        "Costache Elena", "Crhistian Voinea", "Danut Duta", "David Tamargo", "David Voinea",
        "Davide Sancassani", "Dayanna", "Denís Fernández", "Dinh Ha", "Enrique Brotons",
        "Eric Lasso", "Federico Mariño Martilotto", "Fina Fernández", "Fiorella Mariño",
        "Gabi Valverde", "Gabriel Voinea", "Helen Distefano", "Javier Díaz Valledor",
        "Jesica Mariño", "José Carlos", "Josue Molina", "Juan Carlos Mariño",
        "Lavinia Simona Duta", "Leonardo Mariño", "Lorena Voinea", "Lucía Sánchez",
        "Luis Cabrera", "Lynn Lopes", "Manuel Pulido", "Manuel García Cáceres",
        "Marta García", "Matias Mariño", "Miriam Morales", "Mónica Hein Wertz",
        "Nanci Martilotto", "Narcís Dragomir", "Pablo Molina", "Paula Corbalán",
        "Paula López", "Peiffer-Smadja Solal", "Rosa Chiara Gracia Montilla",
        "Rubel Garcia Ovalles", "Samuel Molina", "Sayei Méndez", "Silvana Cabrera",
        "Sofía", "Susana San Vicente", "Teo Buscoveanu", "Valeria Díaz Hein",
        "Víctor del Castillo", "Juliana Martilotto", "Everton Martilotto",
        "Oliver del Castillo", "Verónica Uhalde", "Gael Brotons",
    ];

    guests.sort((a, b) => a.localeCompare(b));

    // --- 2. AUTOCOMPLETE LOGIC ---
    const wrappers = document.querySelectorAll('.autocomplete-wrapper');

    wrappers.forEach(wrapper => {
        const input = wrapper.querySelector('input');
        const list = document.createElement('div');
        list.className = 'guest-dropdown';
        wrapper.appendChild(list);

        function renderOptions(filterText = '') {
            list.innerHTML = '';
            const lowerFilter = filterText.toLowerCase();
            const filteredGuests = guests.filter(guest => 
                guest.toLowerCase().includes(lowerFilter)
            );

            if (filteredGuests.length === 0) {
                const noResult = document.createElement('div');
                noResult.className = 'guest-option text-zinc-400 italic';
                // Dynamic Translation for "No matches"
                noResult.textContent = translations[currentLang].noMatches; 
                list.appendChild(noResult);
                return;
            }

            filteredGuests.forEach(guest => {
                const option = document.createElement('div');
                option.className = 'guest-option';
                option.textContent = guest;
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    input.value = guest;
                    closeAllLists();
                });
                list.appendChild(option);
            });
        }

        input.addEventListener('focus', () => {
            closeAllLists();
            renderOptions(input.value);
            list.classList.add('active');
        });

        input.addEventListener('input', () => {
            renderOptions(input.value);
            list.classList.add('active');
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) list.classList.remove('active');
        });
    });

    function closeAllLists() {
        document.querySelectorAll('.guest-dropdown').forEach(el => el.classList.remove('active'));
    }

    // --- 3. USER ID LOGIC ---
    let userId = localStorage.getItem('wedding_user_id');
    if (!userId) {
        userId = 'guest-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        localStorage.setItem('wedding_user_id', userId);
    }
    const idField = document.getElementById('userIdField');
    if(idField) idField.value = userId;


    // --- 4. RESTORE PREVIOUS VOTES ---
    const form = document.getElementById('awardsForm');
    const inputs = form.querySelectorAll('input[type="text"]');
    const submitBtn = document.getElementById('submitVote');
    const hintText = document.getElementById('edit-hint');

    inputs.forEach((input, index) => {
        const savedVote = localStorage.getItem(`vote_cat_${index}`);
        if (savedVote) {
            input.value = savedVote;
            // Text is set by setLanguage, but we ensure state is correct
            hintText.classList.remove('hidden');
        }
    });
    // Re-apply language to button in case it changed due to restore
    setLanguage(currentLang);


    // --- 5. SUBMISSION LOGIC ---
    const statusDiv = document.getElementById('form-status');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validation - Empty Fields
        let isValid = true;
        inputs.forEach(input => {
            if(!input.value.trim()) isValid = false;
        });

        if (!isValid) {
            statusDiv.textContent = translations[currentLang].statusErrorEmpty;
            statusDiv.style.color = "#ef4444";
            return;
        }

        // Validation - List Check
        let allNamesValid = true;
        inputs.forEach(input => {
            if (!guests.includes(input.value.trim())) {
                allNamesValid = false;
                input.classList.add('border-red-500');
            }
        });
        if (!allNamesValid) {
            statusDiv.textContent = translations[currentLang].statusErrorList;
            statusDiv.style.color = "#ef4444";
            return;
        } else {
            inputs.forEach(input => input.classList.remove('border-red-500'));
        }

        // Save LocalStorage
        inputs.forEach((input, index) => {
            localStorage.setItem(`vote_cat_${index}`, input.value);
        });

        submitBtn.disabled = true;
        submitBtn.textContent = translations[currentLang].btnSaving;
   
        // GOOGLE FORM URL
        const formActionURL = 'https://docs.google.com/forms/d/e/1FAIpQLScyc2QXPCTyhn__HLLJEn9uVJJcLHKTh9Jqd98Tn3w2iYugZA/formResponse';

        const formData = new FormData(form);

        fetch(formActionURL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        })
        .then(() => {
            launchConfetti();
            
            statusDiv.textContent = translations[currentLang].statusSuccess;
            statusDiv.style.color = "#10b981";
            
            hintText.classList.remove('hidden');
            submitBtn.disabled = false;
            
            // Refresh button text
            setLanguage(currentLang);

            statusDiv.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            statusDiv.textContent = translations[currentLang].statusErrorGeneric;
            statusDiv.style.color = "#ef4444";
            submitBtn.disabled = false;
            setLanguage(currentLang); // Reset button text
        });
    });

    function launchConfetti() {
        const duration = 2000;
        const animationEnd = Date.now() + duration;
        const colors = ['#e5e7eb', '#a3a3a3', '#525252', '#000000'];

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ particleCount, angle: 60, spread: 55, origin: { x: 0, y: 0.7 }, colors });
            confetti({ particleCount, angle: 120, spread: 55, origin: { x: 1, y: 0.7 }, colors });
        }, 250);
    }
});