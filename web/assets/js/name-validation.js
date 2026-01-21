// Name validation - limit to 30 characters
document.addEventListener('DOMContentLoaded', function () {
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');

    // Function to validate name length
    function validateNameLength(input, fieldName) {
        if (!input) return;

        input.addEventListener('input', function (e) {
            const value = e.target.value;

            // Remove any non-alphabetic characters except spaces, hyphens, and apostrophes
            const cleaned = value.replace(/[^a-zA-Z\s\-']/g, '');
            if (value !== cleaned) {
                e.target.value = cleaned;
            }

            // Check length
            if (e.target.value.length >= 30) {
                e.target.setCustomValidity(`${fieldName} must not exceed 30 characters`);
            } else {
                e.target.setCustomValidity('');
            }
        });

        // Show character count hint
        input.addEventListener('focus', function (e) {
            const parent = e.target.parentElement;
            let hint = parent.querySelector('.char-count-hint');

            if (!hint) {
                hint = document.createElement('p');
                hint.className = 'char-count-hint text-xs text-gray-400 mt-1 ml-4';
                parent.appendChild(hint);
            }

            const updateHint = () => {
                const remaining = 30 - e.target.value.length;
                hint.textContent = `${remaining} characters remaining`;

                if (remaining <= 5) {
                    hint.classList.add('text-red-500');
                    hint.classList.remove('text-gray-400');
                } else {
                    hint.classList.remove('text-red-500');
                    hint.classList.add('text-gray-400');
                }
            };

            updateHint();
            e.target.addEventListener('input', updateHint);
        });

        input.addEventListener('blur', function (e) {
            const parent = e.target.parentElement;
            const hint = parent.querySelector('.char-count-hint');
            if (hint) {
                hint.remove();
            }
        });
    }

    // Apply validation to both name fields
    validateNameLength(firstNameInput, 'First name');
    validateNameLength(lastNameInput, 'Last name');
});
