export const formatPhone = (val: string) => val.replace(/\D/g, '').slice(0, 10);
export const formatAadhar = (val: string) => val.replace(/\D/g, '').slice(0, 12);
export const formatPan = (val: string) => val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);

export const isPhoneValid = (val: string) => val.length === 10;
export const isAadharValid = (val: string) => val.length === 12;
export const isPanValid = (val: string) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(val);
