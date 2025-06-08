document.addEventListener('DOMContentLoaded', function() {
    // --- General Page Setup ---
    const yearSpan = document.getElementById('currentYear');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- Custom Google Form Submission ---
    const rsvpForm = document.getElementById('customRsvpForm');
    const formStatus = document.getElementById('form-status');
    const submitButton = document.getElementById('submitRsvpButton');

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', function (e) {
            // This is the most important line. It stops the page from reloading.
            e.preventDefault(); 

            // --- THIS IS THE LINE YOU MUST UPDATE ---
            // I've already filled it in for you using your form's ID.
            const formActionURL = 'https://docs.google.com/forms/d/e/1FAIpQLSfeosnC-Ccddo4jXWHGtjBvNQ6l_EYRRwCg8OjUK0PeNZ5dtA/formResponse';

            // Collect all the data from the form
            const formData = new FormData(rsvpForm);
            
            // Update the button and status message to show it's working
            if(submitButton) submitButton.disabled = true;
            if(submitButton) submitButton.textContent = 'Enviando...';
            if(formStatus) formStatus.textContent = '';


            // Use the "fetch" API to send the data to Google Forms in the background
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
            });
        });
    } else {
        console.error("The RSVP form with id 'customRsvpForm' was not found.");
    }

    console.log("Website script loaded and form handler is active.");
});