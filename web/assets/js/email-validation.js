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

                // Check for @ symbol first
                if (!email.includes('@')) {
                    e.target.setCustomValidity('Email must contain @ symbol');
                    return;
                }

                // Split email into username and domain
                const emailParts = email.split('@');
                if (emailParts.length !== 2) {
                    e.target.setCustomValidity('Please enter a valid email address');
                    return;
                }

                const username = emailParts[0];
                const domain = emailParts[1];

                // Validate username: minimum 8 characters
                if (username.length < 8) {
                    e.target.setCustomValidity('Email username (before @) must be at least 8 characters long');
                    return;
                }

                // Validate username: must include at least one alphabetical character (a-z)
                if (!/[a-z]/.test(username)) {
                    e.target.setCustomValidity('Email username must include at least one alphabetical character (a-z)');
                    return;
                }

                // Validate username: no capital letters allowed
                if (/[A-Z]/.test(username)) {
                    e.target.setCustomValidity('Email username must not contain capital letters');
                    return;
                }

                // Check for domain extension
                if (!domain.includes('.')) {
                    e.target.setCustomValidity('Email must have a valid domain (e.g., .com, .org)');
                    return;
                }

                // Validate complete email format (lowercase only)
                const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
                if (!emailRegex.test(email)) {
                    e.target.setCustomValidity('Please enter a valid email address (e.g., username@example.com)');
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
