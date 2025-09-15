import test from 'node:test';
import assert from 'node:assert/strict';
import { validateBudgetRange } from '../src/app/lib/validators.js';

test('validateBudgetRange allows missing values', () => {
  assert.equal(validateBudgetRange(undefined, 100).ok, true);
  assert.equal(validateBudgetRange(100, undefined).ok, true);
});

test('validateBudgetRange accepts max >= min', () => {
  assert.equal(validateBudgetRange(100, 100).ok, true);
  assert.equal(validateBudgetRange(100, 101).ok, true);
});

test('validateBudgetRange rejects max < min', () => {
  const res = validateBudgetRange(200, 100);
  assert.equal(res.ok, false);
  assert.match(res.message, /greater than or equal/i);
});

