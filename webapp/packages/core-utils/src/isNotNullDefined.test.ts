import { isNotNullDefined } from './isNotNullDefined';

describe('isNotNullDefined', () => {
  it('should return true', () => {
    expect(isNotNullDefined({})).toBe(true);
    expect(isNotNullDefined(1)).toBe(true);
    expect(isNotNullDefined('')).toBe(true);
    expect(isNotNullDefined([])).toBe(true);
    expect(isNotNullDefined(false)).toBe(true);
    expect(isNotNullDefined(true)).toBe(true);
    expect(isNotNullDefined(0)).toBe(true);
    expect(isNotNullDefined(() => {})).toBe(true);
    expect(isNotNullDefined(NaN)).toBe(true);
    expect(isNotNullDefined(Infinity)).toBe(true);
    expect(isNotNullDefined(Symbol(''))).toBe(true);
  });

  it('should return false', () => {
    expect(isNotNullDefined(undefined)).toBe(false);
    expect(isNotNullDefined(null)).toBe(false);
  });
});
