// Quick test to verify phone number validation regex
const phoneRegex = /^[0-9+\s\-()]+$/;

const testCases = [
    { input: "jshfhhgogsjg", expected: false, description: "Only alphabets" },
    { input: "1234567890", expected: true, description: "Valid 10 digits" },
    { input: "+91 9876543210", expected: true, description: "Valid with country code" },
    { input: "(123) 456-7890", expected: true, description: "Valid with formatting" },
    { input: "123abc456", expected: false, description: "Mixed numbers and letters" },
    { input: "12345", expected: true, description: "Only numbers (but less than 10)" },
];

console.log("Phone Number Validation Test Results:\n");
testCases.forEach(test => {
    const result = phoneRegex.test(test.input);
    const status = result === test.expected ? "✅ PASS" : "❌ FAIL";
    console.log(`${status} - ${test.description}`);
    console.log(`   Input: "${test.input}"`);
    console.log(`   Expected: ${test.expected}, Got: ${result}\n`);
});
