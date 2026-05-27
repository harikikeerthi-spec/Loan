export const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 10);
export const formatAadhar = (val: string) => val.replace(/\D/g, '').slice(0, 12);
export const formatPan = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

export const isPhoneValid = (val: string) => {
    // Must be 10 digits
    if (val.length !== 10) return false;
    
    // Must start with 6, 7, 8, or 9 (valid Indian mobile numbers)
    if (!/^[6-9]/.test(val)) return false;
    
    // Check if all digits are the same (0000000000, 1111111111, etc.)
    if (/^(\d)\1{9}$/.test(val)) return false;
    
    // Check for sequential patterns (1234567890, 9876543210, etc.)
    if (/^(?:0123456789|1234567890|2345678901|3456789012|4567890123|5678901234|6789012345|7890123456|8901234567|9876543210|8765432109|7654321098|6543210987|5432109876|4321098765|3210987654|2109876543|1098765432)$/.test(val)) return false;
    
    return true;
};

export const isAadharValid = (val: string) => val.length === 12;
export const isPanValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
