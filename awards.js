document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Initialize Animations
    AOS.init({ duration: 800, once: true });

    // 2. THE GUEST LIST
    const guests = [
        

        "Sebastian Tacuri",
        "Adriana Carrabs",
        "Agustin Nicolas Distefano Ferreira",
        "Agustina Díaz",
        "Amanda Burgos",
        "Amrit Triviño",
        "Andrei Bianca Stefania",
        "Andrei Zoicas",
        "Ángela Abigail García López",
        "Aulê Barbosa",
        "Blanca Guillen",
        "Christian Barrios",
        "Costache Elena",
        "Crhistian Voinea",
        "Danut Duta",
        "David Tamargo",
        "David Voinea",
        "Davide Sancassani",
        "Dayanna",
        "Denís Fernández",
        "Dinh Ha",
        "Enrique Brotons",
        "Eric Lasso",
        "Federico Mariño Martilotto",
        "Fina Fernández",
        "Fiorella Mariño",
        "Gabi Valverde",
        "Gabriel Voinea",
        "Helen Distefano",
        "Javier Díaz Valledor",
        "Jesica Mariño",
        "José Carlos",
        "Josue Molina",
        "Juan Carlos Mariño",
        "Lavinia Simona Duta",
        "Leonardo Mariño",
        "Lorena Voinea",
        "Lucía Sánchez",
        "Luis Cabrera",
        "Lynn Lopes",
        "Manuel Pulido",
        "Manuel García Cáceres",
        "Marta García",
        "Matias Mariño",
        "Miriam Morales",
        "Mónica Hein Wertz",
        "Nanci Martilotto",
        "Narcís Dragomir",
        "Pablo Molina",
        "Paula Corbalán",
        "Paula López",
        "Peiffer-Smadja Solal",
        "Rosa Chiara Gracia Montilla",
        "Rubel Garcia Ovalles",
        "Samuel Molina",
        "Sayei Méndez",
        "Silvana Cabrera",
        "Sofía",
        "Susana San Vicente",
        "Teo Buscoveanu",
        "Valeria Díaz Hein",
        "Víctor del Castillo",
        "Juliana Martilotto",
        "Everton Martilotto",
        "Oliver del Castillo",
        "Verónica Uhalde",
        "Gael Brotons",
    ];

    // Sort names alphabetically for better UX
    guests.sort((a, b) => a.localeCompare(b));

    // 3. Populate the Datalist
    const datalist = document.getElementById('guestListOptions');
    guests.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        datalist.appendChild(option);
    });

    // --- 2. USER ID LOGIC (The "Cookie") ---
    // We check if this phone already has an ID. If not, create one.
    let userId = localStorage.getItem('wedding_user_id');
    
    if (!userId) {
        // Generate a random ID: timestamp + random number
        userId = 'guest-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
        localStorage.setItem('wedding_user_id', userId);
    }

    // Set the hidden field value
    const idField = document.getElementById('userIdField');
    if(idField) idField.value = userId;


    // --- 3. RESTORE PREVIOUS VOTES ---
    const form = document.getElementById('awardsForm');
    const inputs = form.querySelectorAll('input[list="guestListOptions"]');
    const submitBtn = document.getElementById('submitVote');
    const hintText = document.getElementById('edit-hint');

    // Load saved votes from LocalStorage
    inputs.forEach((input, index) => {
        const savedVote = localStorage.getItem(`vote_cat_${index}`);
        if (savedVote) {
            input.value = savedVote;
            // Change UI to show they are editing
            submitBtn.textContent = "ACTUALIZAR MIS VOTOS";
            hintText.classList.remove('hidden');
        }
    });

    // --- 4. SUBMISSION LOGIC ---
    const statusDiv = document.getElementById('form-status');
    const successDiv = document.getElementById('successMessage');

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validation
        let isValid = true;
        inputs.forEach(input => {
            if(!input.value.trim()) isValid = false;
        });

        if (!isValid) {
            statusDiv.textContent = "Por favor, rellena todas las categorías.";
            statusDiv.style.color = "red";
            return;
        }

        // SAVE VOTES TO LOCAL STORAGE (So they remain if user reloads)
        inputs.forEach((input, index) => {
            localStorage.setItem(`vote_cat_${index}`, input.value);
        });

        submitBtn.disabled = true;
        submitBtn.textContent = "Guardando...";
   
        
        // GOOGLE FORM URL (Replace with your Form Action URL)
        // Usually looks like: https://docs.google.com/forms/u/0/d/e/FORM_ID/formResponse
        const formActionURL = 'https://docs.google.com/forms/d/e/1FAIpQLScyc2QXPCTyhn__HLLJEn9uVJJcLHKTh9Jqd98Tn3w2iYugZA/formResponse';

        const formData = new FormData(form);

        fetch(formActionURL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        })
        .then(() => {
            // Instead of hiding the form completely, we just show success 
            // and let them stay on the page if they want to edit again.
            
            launchConfetti();
            
            statusDiv.textContent = "¡Votos guardados! Puedes cerrar esta página o editar si cambias de opinión.";
            statusDiv.style.color = "green";
            
            submitBtn.textContent = "ACTUALIZAR MIS VOTOS";
            submitBtn.disabled = false;
            hintText.classList.remove('hidden');

            // Scroll to bottom to see message
            statusDiv.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(error => {
            console.error('Error:', error);
            statusDiv.textContent = "Hubo un error. Inténtalo de nuevo.";
            statusDiv.style.color = "red";
            submitBtn.disabled = false;
        });
    });

    // Confetti Effect
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
    
    // Simple Language Logic (If you want to support EN/ES on this page too)
    // You can copy the logic from script.js if needed, strictly purely visual here.
    const langBtns = document.querySelectorAll('[data-lang]');
    langBtns.forEach(btn => {
        btn.addEventListener('click', () => {
             // Redirect to translated version or simple JS text swap
             // For a simple event page, sticking to Spanish is usually fine.
             alert("Language switch for Awards page coming soon!"); 
        });
    });
});