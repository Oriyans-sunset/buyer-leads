/**
 * Validate that budgetMax is >= budgetMin when both are numbers.
 * If either is undefined or null, it's considered valid.
 * @param {number|undefined|null} min
 * @param {number|undefined|null} max
 * @returns {{ok: boolean, message?: string}}
 */
export function validateBudgetRange(min, max) {
  if (min == null || max == null) return { ok: true };
  if (typeof min !== 'number' || typeof max !== 'number') return { ok: true };
  if (max < min) {
    return { ok: false, message: 'budgetMax must be greater than or equal to budgetMin' };
  }
  return { ok: true };
}

