// Date of Birth validation - DD-MM-YYYY format
document.addEventListener('DOMContentLoaded', function () {
    const dobInput = document.getElementById('dateOfBirth');

    if (dobInput) {
        // Auto-format date as user types
        dobInput.addEventListener('input', function (e) {
            let value = e.target.value.replace(/\D/g, ''); // Remove non-digits

            // Format as DD-MM-YYYY
            if (value.length >= 2) {
                value = value.substring(0, 2) + '-' + value.substring(2);
            }
            if (value.length >= 5) {
                value = value.substring(0, 5) + '-' + value.substring(5, 9);
            }

            e.target.value = value;
        });

        // Validate date on blur
        dobInput.addEventListener('blur', function (e) {
            const value = e.target.value.trim();

            if (value === '') return; // Skip if empty (required attribute will handle this)

            // Check format DD-MM-YYYY
            const datePattern = /^(0[1-9]|[12][0-9]|3[01])-(0[1-9]|1[0-2])-\d{4}$/;
            if (!datePattern.test(value)) {
                e.target.setCustomValidity('Please enter date in DD-MM-YYYY format (e.g., 15-01-1990)');
                return;
            }

            // Parse and validate actual date
            const parts = value.split('-');
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10);
            const year = parseInt(parts[2], 10);

            // Check if it's a valid date
            const date = new Date(year, month - 1, day);
            if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
                e.target.setCustomValidity('Please enter a valid date');
                return;
            }

            // Check if date is not in the future
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date > today) {
                e.target.setCustomValidity('Date of birth cannot be in the future');
                return;
            }

            // Check if person is at least 18 years old
            const age = Math.floor((today - date) / (365.25 * 24 * 60 * 60 * 1000));
            if (age < 18) {
                e.target.setCustomValidity('You must be at least 18 years old');
                return;
            }

            // Check if date is reasonable (not more than 120 years ago)
            if (age > 120) {
                e.target.setCustomValidity('Please enter a valid date of birth');
                return;
            }

            // Clear any previous custom validity
            e.target.setCustomValidity('');
        });

        // Clear custom validity on input
        dobInput.addEventListener('input', function (e) {
            e.target.setCustomValidity('');
        });

        // Prevent pasting non-numeric content
        dobInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = pastedText.replace(/\D/g, '');

            // Format the pasted content
            let formatted = cleaned;
            if (cleaned.length >= 2) {
                formatted = cleaned.substring(0, 2) + '-' + cleaned.substring(2);
            }
            if (cleaned.length >= 4) {
                formatted = formatted.substring(0, 5) + '-' + cleaned.substring(4, 8);
            }

            this.value = formatted.substring(0, 10);
        });
    }
});
