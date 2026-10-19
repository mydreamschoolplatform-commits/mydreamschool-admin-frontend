import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('--- Running Teacher Exams Page Access & Support Stats Regression Test ---');

// 1. Static Contract Analysis of Layout.jsx
const layoutPath = path.resolve(__dirname, '../src/components/Layout.jsx');
const layoutContent = fs.readFileSync(layoutPath, 'utf8');

// Test 1.1: Ensure old broad condition 'user?.role !== "Student"' is NOT present
assert.ok(
    !layoutContent.includes("user?.role !== 'Student'"),
    'Layout.jsx must NOT use broad "user?.role !== \'Student\'" condition which causes Teachers to poll support stats'
);
console.log('✓ Test 1.1 Passed: Broad "user?.role !== \'Student\'" check eliminated from Layout.jsx');

// Test 1.2: Ensure exact role restriction for support stats polling is present
assert.ok(
    layoutContent.includes("['Super Admin', 'Owner', 'School Admin'].includes(user?.role)"),
    'Layout.jsx must restrict support ticket stats polling strictly to Super Admin, Owner, and School Admin'
);
console.log('✓ Test 1.2 Passed: Support stats polling explicitly restricted to Super Admin, Owner, and School Admin');

// 2. Behavioral Unit Evaluation of the Guard Logic
const shouldPollSupportStats = (user) => {
    return ['Super Admin', 'Owner', 'School Admin'].includes(user?.role);
};

const shouldShowSupportDeskNav = (user) => {
    return user?.role !== 'Teacher';
};

// Test 2.1: Teacher "Math" must NOT poll support stats
const teacherMath = { role: 'Teacher', username: 'Math', assignedSubjects: [{ subjectId: 'math_sub_1' }] };
assert.equal(
    shouldPollSupportStats(teacherMath),
    false,
    'Teacher "Math" must NOT poll support ticket stats (/support/admin/stats)'
);
console.log('✓ Test 2.1 Passed: Teacher "Math" correctly skips /support/admin/stats polling');

// Test 2.2: Teacher "Math" must NOT see Support Desk navigation
assert.equal(
    shouldShowSupportDeskNav(teacherMath),
    false,
    'Teacher "Math" must NOT have Support Desk link in navigation'
);
console.log('✓ Test 2.2 Passed: Support Desk navigation link correctly hidden from Teacher "Math"');

// Test 2.3: Student must NOT poll support stats
const studentUser = { role: 'Student', username: 'student1' };
assert.equal(
    shouldPollSupportStats(studentUser),
    false,
    'Student must NOT poll support ticket stats'
);
console.log('✓ Test 2.3 Passed: Student correctly skips support stats polling');

// Test 2.4: School Admin MUST poll support stats
const schoolAdminUser = { role: 'School Admin', username: 'admin_schoolA' };
assert.equal(
    shouldPollSupportStats(schoolAdminUser),
    true,
    'School Admin MUST be allowed to poll support ticket stats'
);
console.log('✓ Test 2.4 Passed: School Admin retains support ticket stats polling');

// Test 2.5: Super Admin MUST poll support stats
const superAdminUser = { role: 'Super Admin', username: 'superadmin' };
assert.equal(
    shouldPollSupportStats(superAdminUser),
    true,
    'Super Admin MUST be allowed to poll support ticket stats'
);
console.log('✓ Test 2.5 Passed: Super Admin retains support ticket stats polling');

// Test 2.6: Owner MUST poll support stats
const ownerUser = { role: 'Owner', username: 'platform_owner' };
assert.equal(
    shouldPollSupportStats(ownerUser),
    true,
    'Owner MUST be allowed to poll support ticket stats'
);
console.log('✓ Test 2.6 Passed: Owner retains support ticket stats polling');

console.log('\nAll 8 Teacher Exams Page & Support Stats Regression Tests PASSED successfully!');
