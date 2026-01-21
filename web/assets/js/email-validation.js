// Email validation - ensure proper format with lowercase, @, and domain
document.addEventListener('DOMContentLoaded', function () {
    const emailInputs = document.querySelectorAll('input[type="email"]');

    emailInputs.forEach(emailInput => {
        if (emailInput) {
            // Convert to lowercase on input
            emailInput.addEventListener('input', function (e) {
                // Auto-convert to lowercase
                const cursorPosition = e.target.selectionStart;
                e.target.value = e.target.value.toLowerCase();
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            });

            // Validate email format on blur
            emailInput.addEventListener('blur', function (e) {
                const email = e.target.value.trim();

                if (email === '') return; // Skip if empty (required attribute will handle this)

                // Check for @ symbol
                if (!email.includes('@')) {
                    e.target.setCustomValidity('Email must contain @ symbol');
                    return;
                }

                // Check for domain extension
                const emailParts = email.split('@');
                if (emailParts.length !== 2 || !emailParts[1].includes('.')) {
                    e.target.setCustomValidity('Email must have a valid domain (e.g., .com, .org)');
                    return;
                }

                // Validate email format
                const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (!emailRegex.test(email)) {
                    e.target.setCustomValidity('Please enter a valid email address (e.g., user@example.com)');
                    return;
                }

                // Clear any previous custom validity
                e.target.setCustomValidity('');
            });

            // Clear custom validity on input
            emailInput.addEventListener('input', function (e) {
                e.target.setCustomValidity('');
            });
        }
    });
});
