import { isGoodQualityByThreshold, QUALITY_MIN_FAT, QUALITY_MIN_SNF } from "../src/utils/quality.js";

const cases = [
  { fat: 3.5, snf: 8.5, expected: true, name: "boundary good" },
  { fat: 3.49, snf: 8.5, expected: false, name: "fat below threshold" },
  { fat: 3.5, snf: 8.49, expected: false, name: "snf below threshold" },
  { fat: 4.2, snf: 8.8, expected: true, name: "above threshold good" },
  { fat: 6.8, snf: 9.1, expected: true, name: "buffalo style values still good" },
  { fat: 2.9, snf: 7.9, expected: false, name: "both below threshold" },
];

let failed = 0;

console.log(`Checking milk quality rule: FAT >= ${QUALITY_MIN_FAT} and SNF >= ${QUALITY_MIN_SNF}`);

for (const testCase of cases) {
  const actual = isGoodQualityByThreshold({ fat: testCase.fat, snf: testCase.snf });
  const ok = actual === testCase.expected;
  const label = ok ? "PASS" : "FAIL";
  console.log(
    `[${label}] ${testCase.name} -> fat=${testCase.fat}, snf=${testCase.snf}, expected=${testCase.expected}, actual=${actual}`
  );
  if (!ok) failed += 1;
}

if (failed > 0) {
  console.error(`Quality rule check failed: ${failed} case(s) did not match expected output.`);
  process.exit(1);
}

console.log("Quality rule check passed for all cases.");

