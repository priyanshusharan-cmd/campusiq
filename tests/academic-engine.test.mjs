import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

function load(path, dependencies = {}, globals = {}) {
  const source = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    require: name => {
      if (!(name in dependencies)) throw new Error(`Unexpected import: ${name}`);
      return dependencies[name];
    },
    Math,
    Infinity,
    ...globals,
  });
  return exports;
}

const pureAttendance = load('src/lib/pureAttendanceUtils.ts');
const attendance = load('src/lib/attendanceUtils.ts', {
  '@/constants': { DEFAULTS: { attendanceTarget: 75 } },
  './pureAttendanceUtils': pureAttendance,
  'date-fns': { parseISO: () => new Date(), eachDayOfInterval: () => [], format: () => '', startOfMonth: () => new Date() },
});
const grades = load('src/lib/gradeUtils.ts');

test('calcAttendancePercentage handles zero classes and precision', () => {
  assert.equal(attendance.calcAttendancePercentage(0, 0), 100);
  assert.equal(attendance.calcAttendancePercentage(18, 20), 90);
  assert.equal(attendance.calcAttendancePercentage(1, 3), 33.33);
});

test('calcCanMiss calculates maximum classes that can be missed safely', () => {
  // 18 present out of 20 with 75% target: floor((18*100 - 75*20) / 75) = floor((1800 - 1500)/75) = 4
  assert.equal(pureAttendance.calcCanMiss(18, 20, 75), 4);
  // Exactly at 75%: 15 present out of 20
  assert.equal(pureAttendance.calcCanMiss(15, 20, 75), 0);
  // Below threshold: 14 present out of 20
  assert.equal(pureAttendance.calcCanMiss(14, 20, 75), 0);
  // Zero classes conducted
  assert.equal(pureAttendance.calcCanMiss(0, 0, 75), 0);
});

test('calcNeedToAttend calculates minimum consecutive classes to recover', () => {
  // 14 present out of 20 with 75% target: ceil((75*20 - 14*100) / (100 - 75)) = ceil((1500 - 1400)/25) = 4
  assert.equal(attendance.calcNeedToAttend(14, 20, 75), 4);
  // Already safe (18/20)
  assert.equal(attendance.calcNeedToAttend(18, 20, 75), 0);
  // Target 100% when below is impossible / Infinity
  assert.equal(attendance.calcNeedToAttend(18, 20, 100), Infinity);
  // Zero classes conducted
  assert.equal(attendance.calcNeedToAttend(0, 0, 75), 0);
});

test('calcSGPA and calcCGPA calculate credit-weighted averages', () => {
  const entries = [
    { credits: 4, gradePoint: 9 }, // 36
    { credits: 3, gradePoint: 8 }, // 24
    { credits: 3, gradePoint: 10 }, // 30
  ];
  // Total points = 90, total credits = 10 -> SGPA = 9.0
  assert.equal(grades.calcSGPA(entries), 9.0);

  // Unequal semester credits CGPA
  const semesters = [
    { sgpa: 8.0, credits: 20 }, // 160
    { sgpa: 9.0, credits: 10 }, // 90 -> total = 250 / 30 = 8.33
  ];
  assert.equal(grades.calcCGPA(semesters), 8.33);
});

test('calcTargetSGPA determines required SGPA and achievability', () => {
  // Current CGPA: 8.2, Target: 8.5, Completed: 80, Current Sem: 20
  // Formula: (8.5 * 100 - 8.2 * 80) / 20 = (850 - 656) / 20 = 194 / 20 = 9.7
  const result = grades.calcTargetSGPA(8.2, 8.5, 80, 20);
  assert.equal(result.requiredSGPA, 9.7);
  assert.equal(result.isAchievable, true);
  assert.equal(result.maxPossibleCGPA, 8.56);

  // Impossible goal: target 9.5 from 8.0 with 80 credits and 20 current
  // (9.5 * 100 - 8.0 * 80) / 20 = (950 - 640) / 20 = 310 / 20 = 15.5 (> 10)
  const impossible = grades.calcTargetSGPA(8.0, 9.5, 80, 20);
  assert.equal(impossible.requiredSGPA, 15.5);
  assert.equal(impossible.isAchievable, false);
});
