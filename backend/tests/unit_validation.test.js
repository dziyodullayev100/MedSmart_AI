/**
 * Unit Test Example 2 for MedSmart
 * Tests validation functions for Email and Password strength
 */

const validateEmail = (email) => {
    const re = /\S+@\S+\.\S+/;
    return re.test(email);
};

const validatePassword = (password) => {
    return password.length >= 8;
};

function runUnitTest() {
    console.log('--- UNIT TEST 2: Data Validation ---');
    
    const emailTests = [
        { input: 'test@bemor.com', expected: true },
        { input: 'not_an_email', expected: false }
    ];

    const passTests = [
        { input: 'password123', expected: true },
        { input: 'short', expected: false }
    ];

    let passed = 0;
    
    console.log('\nTekshiruv: Email formatlari');
    emailTests.forEach((tc, i) => {
        const result = validateEmail(tc.input);
        if (result === tc.expected) {
            console.log(`[PASS] Email Test ${i + 1}: '${tc.input}' kutilganidek ishladi.`);
            passed++;
        }
    });

    console.log('\nTekshiruv: Parol uzunligi');
    passTests.forEach((tc, i) => {
        const result = validatePassword(tc.input);
        if (result === tc.expected) {
            console.log(`[PASS] Parol Test ${i + 1}: kutilganidek ishladi.`);
            passed++;
        }
    });

    console.log(`\nResult: ${passed}/4 unit tests passed.`);
}

runUnitTest();
