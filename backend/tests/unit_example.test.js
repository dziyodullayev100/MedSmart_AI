/**
 * Unit Test Example for MedSmart
 * Tests a single utility function in isolation.
 */

// Simulating a utility function that would normally be in a separate file
const formatPhoneNumber = (phone) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('998')) {
        return `+${cleaned.slice(0, 3)} (${cleaned.slice(3, 5)}) ${cleaned.slice(5, 8)}-${cleaned.slice(8, 10)}-${cleaned.slice(10, 12)}`;
    }
    return phone;
};

function runUnitTest() {
    console.log('--- UNIT TEST: formatPhoneNumber ---');
    
    const testCases = [
        { input: '998901234567', expected: '+998 (90) 123-45-67' },
        { input: '+998901112233', expected: '+998 (90) 111-22-33' },
        { input: '12345', expected: '12345' }
    ];

    let passed = 0;
    testCases.forEach((tc, index) => {
        const result = formatPhoneNumber(tc.input);
        if (result === tc.expected) {
            console.log(`[PASS] Test ${index + 1}: ${tc.input} -> ${result}`);
            passed++;
        } else {
            console.log(`[FAIL] Test ${index + 1}: Expected ${tc.expected}, got ${result}`);
        }
    });

    console.log(`\nResult: ${passed}/${testCases.length} unit tests passed.`);
}

runUnitTest();
