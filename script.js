document.addEventListener('DOMContentLoaded', function() {
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
        // Ocultar el campo de acompañantes al cargar la página
        guestsWrapper.style.display = 'none';
        dietWrapper.style.display = 'none';
        songWrapper.style.display = 'none';

        attendingSelect.addEventListener('change', function() {
            if (this.value === 'Sí') {
                // Si asiste, muestra el campo y pon el mínimo en 1 (ellos mismos)
                guestsWrapper.style.display = 'block';
                dietWrapper.style.display = 'block';
                songWrapper.style.display = 'block';
                guestsInput.value = '1';
                guestsInput.min = '1';
            } else {
                // Si no asiste, oculta el campo y resetea el valor a 0
                guestsWrapper.style.display = 'none';
                dietWrapper.style.display = 'none';
                songWrapper.style.display = 'none';
                guestsInput.value = '0';
                guestsInput.min = '0';
            }
        });
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
            
            const formActionURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfeosnC-Ccddo4jXWHGtjBvNQ6l_EYRRwCg8OjUK0PeNZ5dtA/formResponse';

            const formData = new FormData(rsvpForm);
            
            if(submitButton) submitButton.disabled = true;
            if(submitButton) submitButton.textContent = 'Enviando...';
            if(formStatus) formStatus.textContent = '';


            fetch(formActionURL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors' // This is required to avoid a CORS error from Google
            })
            .then(() => {
                // This block runs if the submission was successful
                if(formStatus) formStatus.textContent = '¡Gracias! Hemos recibido tu confirmación.';
                if(formStatus) formStatus.style.color = 'green'; // Use a success color
                if(submitButton) submitButton.textContent = '¡Enviado!';
                rsvpForm.reset(); // Optional: clears the form fields
            })
            .catch(error => {
                // This block runs if there was an error
                console.error('Error submitting form:', error);
                if(formStatus) formStatus.textContent = '¡Ups! Algo salió mal. Por favor, inténtalo de nuevo.';
                if(formStatus) formStatus.style.color = 'red'; // Use an error color
                if(submitButton) submitButton.textContent = 'ENVIAR CONFIRMACIÓN';
                if(submitButton) submitButton.disabled = false;
            })
            .finally(() => {
                isSubmitting = false;
            });
        });
    } else {
        console.error("The RSVP form with id 'customRsvpForm' was not found.");
    }

    const weddingDate = new Date("2025-12-28T11:30:00").getTime();

    const updateCountdown = () => {
        const now = new Date().getTime();
        const distance = weddingDate - now;

        if (distance < 0) {
            document.getElementById("countdown").innerHTML = '<h3 class="font-script text-4xl text-zinc-800">¡Llegó el gran día!</h3>';
            clearInterval(countdownInterval);
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("days").textContent = days.toString().padStart(2, '0');
        document.getElementById("hours").textContent = hours.toString().padStart(2, '0');
        document.getElementById("minutes").textContent = minutes.toString().padStart(2, '0');
        document.getElementById("seconds").textContent = seconds.toString().padStart(2, '0');
    };

    const countdownInterval = setInterval(updateCountdown, 1000);

    AOS.init({
        duration: 800, // Duración de la animación en milisegundos
        once: true,    // La animación solo ocurre una vez
    });

    function launchConfetti() {
    const duration = 1000; // El confeti desaparecerá después de 1 segundos
    const animationEnd = Date.now() + duration;
    
    // Colores elegantes que coinciden con tu paleta de zinc/grises y un toque granate
    const colors = ['#e5e7eb', '#a3a3a3', '#525252', '#800000'];

    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
        return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Lanzar desde la izquierda
        confetti({
        particleCount: particleCount,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 }, // Origen en el lado izquierdo
        colors: colors
        });

        // Lanzar desde la derecha
        confetti({
        particleCount: particleCount,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 }, // Origen en el lado derecho
        colors: colors
        });

    }, 250);
    }

    // Lanza el confeti tan pronto como el script se carga
    launchConfetti();


    console.log("Website script loaded and form handler is active.");
});