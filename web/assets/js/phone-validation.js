// Phone number input validation - only allow numbers, +, -, spaces, and parentheses
document.addEventListener('DOMContentLoaded', function () {
    const phoneNumberInput = document.getElementById('phoneNumber');

    if (phoneNumberInput) {
        phoneNumberInput.addEventListener('input', function (e) {
            // Remove any characters that are not numbers, +, -, spaces, or parentheses
            const cleaned = e.target.value.replace(/[^0-9+\s\-()]/g, '');
            if (e.target.value !== cleaned) {
                e.target.value = cleaned;
            }
        });

        // Prevent pasting non-numeric content
        phoneNumberInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const pastedText = (e.clipboardData || window.clipboardData).getData('text');
            const cleaned = pastedText.replace(/[^0-9+\s\-()]/g, '');

            // Insert cleaned text at cursor position
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const currentValue = this.value;
            this.value = currentValue.substring(0, start) + cleaned + currentValue.substring(end);

            // Set cursor position after pasted content
            const newCursorPos = start + cleaned.length;
            this.setSelectionRange(newCursorPos, newCursorPos);
        });

        // Prevent typing non-numeric characters
        phoneNumberInput.addEventListener('keypress', function (e) {
            const char = String.fromCharCode(e.which);
            // Allow only numbers, +, -, spaces, and parentheses
            if (!/[0-9+\s\-()]/.test(char)) {
                e.preventDefault();
            }
        });
    }
});
