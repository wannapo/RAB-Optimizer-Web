import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateSavingsTarget } from './budget.ts';

test('calculates the saving needed to reach the desired final budget', () => {
  assert.equal(calculateSavingsTarget(300_000_000, 250_000_000), 50_000_000);
});

test('returns zero when the desired budget is not below the current total', () => {
  assert.equal(calculateSavingsTarget(300_000_000, 325_000_000), 0);
});

test('returns zero when no valid desired budget is provided', () => {
  assert.equal(calculateSavingsTarget(300_000_000, 0), 0);
  assert.equal(calculateSavingsTarget(300_000_000, Number.NaN), 0);
});
