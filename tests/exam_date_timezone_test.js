import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
    toUtcIsoString,
    toLocalDatetimeInputString,
    formatExamCardDate,
    formatExamMonthYear,
    SCHOOL_TIMEZONE
} from '../src/utils/dateUtils.js';

const currentTz = process.env.TEST_TZ_RUNNER || process.env.TZ || 'Default System';

console.log(`--- Running Exam Date Timezone Regression Tests [Host TZ: ${currentTz}] ---`);
console.log(`School Timezone configured as: ${SCHOOL_TIMEZONE}`);

// Test 1: Create an exam for 18 October 2026 at 19:30 IST; API payload must represent 14:00 UTC
{
    const inputIst = '2026-10-18T19:30';
    const payloadUtc = toUtcIsoString(inputIst);
    assert.equal(payloadUtc, '2026-10-18T14:00:00.000Z', '19:30 IST must convert to 14:00:00.000Z UTC');
    console.log('✓ Test 1 Passed: 18 Oct 2026 19:30 IST correctly converted to 14:00:00.000Z UTC for API payload');
}

// Test 2: Load 2026-10-18T14:00:00.000Z into the edit form; it must display 2026-10-18T19:30
{
    const apiUtc = '2026-10-18T14:00:00.000Z';
    const formValue = toLocalDatetimeInputString(apiUtc);
    assert.equal(formValue, '2026-10-18T19:30', '14:00:00.000Z UTC must convert to 2026-10-18T19:30 in edit form');
    console.log('✓ Test 2 Passed: 14:00:00.000Z UTC correctly loaded into edit form as 2026-10-18T19:30');
}

// Test 3: Edit to 20:00 IST; saved UTC value must represent 14:30 UTC
{
    const editedIst = '2026-10-18T20:00';
    const savedUtc = toUtcIsoString(editedIst);
    assert.equal(savedUtc, '2026-10-18T14:30:00.000Z', '20:00 IST must convert to 14:30:00.000Z UTC');
    const reloadedFormValue = toLocalDatetimeInputString(savedUtc);
    assert.equal(reloadedFormValue, '2026-10-18T20:00', 'Reloading saved 14:30 UTC must display 20:00 IST');
    console.log('✓ Test 3 Passed: Edit to 20:00 IST saves as 14:30:00.000Z UTC and reloads as 20:00');
}

// Test 4: Schedule 23:30 IST on 18 October; the list must still display 18 October, 23:30
{
    const lateEveningIst = '2026-10-18T23:30';
    const savedUtc = toUtcIsoString(lateEveningIst);
    assert.equal(savedUtc, '2026-10-18T18:00:00.000Z', '23:30 IST must save as 18:00:00.000Z UTC');

    const cardDisplay = formatExamCardDate(savedUtc);
    assert.equal(cardDisplay.day, '18', 'Card day must be 18 October');
    assert.equal(cardDisplay.dayName, 'Sun', 'Card dayName must be Sun');
    assert.match(cardDisplay.time.toUpperCase(), /11:30\s*PM/, 'Card time must be 11:30 PM');

    const monthYear = formatExamMonthYear(savedUtc);
    assert.equal(monthYear, 'October 2026', 'Grouped month must be October 2026');
    console.log('✓ Test 4 Passed: 23:30 IST on 18 Oct remains on 18 Oct in card display and month grouping');
}

// Test 5: Verify date behavior around midnight (00:15 IST and 00:00 IST on 19 October)
{
    const midnightIst = '2026-10-19T00:15';
    const savedUtc = toUtcIsoString(midnightIst);
    assert.equal(savedUtc, '2026-10-18T18:45:00.000Z', '00:15 IST on 19 Oct must save as 18:45 UTC on 18 Oct');

    const cardDisplay = formatExamCardDate(savedUtc);
    assert.equal(cardDisplay.day, '19', 'Card day must be 19 October');
    assert.equal(cardDisplay.dayName, 'Mon', 'Card dayName must be Mon');
    assert.match(cardDisplay.time.toUpperCase(), /12:15\s*AM/, 'Card time must be 12:15 AM');

    const exactlyMidnightIst = '2026-10-19T00:00';
    const savedMidnightUtc = toUtcIsoString(exactlyMidnightIst);
    assert.equal(savedMidnightUtc, '2026-10-18T18:30:00.000Z', '00:00 IST on 19 Oct must save as 18:30 UTC on 18 Oct');
    const midnightDisplay = formatExamCardDate(savedMidnightUtc);
    assert.equal(midnightDisplay.day, '19', '00:00 IST card day must be 19');
    assert.match(midnightDisplay.time.toUpperCase(), /12:00\s*AM/, '00:00 IST time must be 12:00 AM');
    console.log('✓ Test 5 Passed: Midnight boundary properly transitions day and time in IST');
}

// Test 6: Safe handling of missing, null, empty, or invalid date values
{
    assert.equal(toUtcIsoString(''), null, 'Empty string returns null');
    assert.equal(toUtcIsoString(null), null, 'null returns null');
    assert.equal(toUtcIsoString(undefined), null, 'undefined returns null');
    assert.equal(toUtcIsoString('invalid-date'), null, 'Invalid date string returns null');

    assert.equal(toLocalDatetimeInputString(''), '', 'Empty string returns empty string');
    assert.equal(toLocalDatetimeInputString(null), '', 'null returns empty string');
    assert.equal(toLocalDatetimeInputString(undefined), '', 'undefined returns empty string');
    assert.equal(toLocalDatetimeInputString('invalid-date'), '', 'Invalid date string returns empty string');

    const emptyCard = formatExamCardDate(null);
    assert.deepEqual(emptyCard, { day: '--', dayName: '--', time: '--' }, 'null card date returns fallbacks');
    const invalidCard = formatExamCardDate('invalid-date');
    assert.deepEqual(invalidCard, { day: '--', dayName: '--', time: '--' }, 'invalid card date returns fallbacks');

    assert.equal(formatExamMonthYear(null), 'Unscheduled', 'null month year returns Unscheduled');
    assert.equal(formatExamMonthYear('invalid-date'), 'Unscheduled', 'invalid month year returns Unscheduled');
    console.log('✓ Test 6 Passed: Missing and invalid values handled safely with graceful fallbacks');
}

// Test 7: Idempotency / Round-trip conversions
{
    const times = ['2026-10-18T09:00', '2026-10-18T13:45', '2026-10-18T19:30', '2026-10-18T23:59'];
    for (const t of times) {
        const utc = toUtcIsoString(t);
        const backToIst = toLocalDatetimeInputString(utc);
        assert.equal(backToIst, t, `Round-trip for ${t} must match exactly`);
    }
    console.log('✓ Test 7 Passed: Round-trip local -> UTC -> local is completely lossless');
}

// Multi-Timezone Host Verification
// When run as top-level runner, recursively test across different host system timezones:
if (!process.env.TEST_TZ_RUNNER) {
    const testFile = fileURLToPath(import.meta.url);
    const hostTimezones = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Asia/Tokyo'];

    console.log('\n--- Multi-Timezone Host Verification ---');
    for (const tz of hostTimezones) {
        const res = spawnSync(process.execPath, [testFile], {
            env: { ...process.env, TZ: tz, TEST_TZ_RUNNER: tz },
            encoding: 'utf-8'
        });
        if (res.status !== 0) {
            console.error(`FAILED under host TZ: ${tz}`);
            console.error(res.stderr || res.stdout);
            process.exit(1);
        }
        console.log(`✓ Verified identically under Host System TZ = ${tz}`);
    }
}

console.log('--- ALL REGRESSION TESTS PASSED SUCCESSFULLY ---');
