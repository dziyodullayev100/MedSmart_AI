/**
 * Unit Test Example 3 for MedSmart
 * Tests date manipulation and age calculation utilities.
 */

const calculateAge = (dobString) => {
    const today = new Date('2026-03-29'); // Fixed date for testing
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

function runDateUtilsTest() {
    console.log('--- UNIT TEST 3: Yosh Hisoblash (Age Calculation) ---');
    
    const tests = [
        { dob: '1990-01-01', expected: 36 },
        { dob: '2010-06-15', expected: 15 },
        { dob: '2025-12-31', expected: 0 }
    ];

    let passed = 0;
    tests.forEach((tc, i) => {
        const result = calculateAge(tc.dob);
        if (result === tc.expected) {
            console.log(`[PASS] Tug'ilgan sana ${tc.dob} yoshi ${result} ga teng. (Kutilgan: ${tc.expected})`);
            passed++;
        } else {
            console.log(`[FAIL] Tug'ilgan sana ${tc.dob} noto'g'ri hisoblandi. (Kutilgan: ${tc.expected}, Chiqdi: ${result})`);
        }
    });

    console.log(`\nNatija: ${passed}/3 ta 'Unit' test muvaffaqiyatli yakunlandi.`);
}

runDateUtilsTest();
