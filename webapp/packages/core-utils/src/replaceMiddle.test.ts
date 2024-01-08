import { replaceMiddle } from './replaceMiddle';

describe('replaceMiddle', () => {
  it('should replace middle of string', () => {
    const result = replaceMiddle('1234567890', '...', 3, 9);
    expect(result).toBe('123...890');
  });

  it('should return value if it is shorter than limiter', () => {
    const result = replaceMiddle('1234567890', '...', 3, 11);
    expect(result).toBe('1234567890');
  });

  it('should return replacement only if side length is 0', () => {
    const result = replaceMiddle('1234567890', '...', 0, 0);
    expect(result).toBe('...');
  });

  it('should return replacement only if side length is negative', () => {
    const result = replaceMiddle('1234567890', '...', -1, 3);
    expect(result).toBe('...');
  });
});
