import { getMIME } from './getMIME';

describe('getMIME', () => {
  it('should return null if binary is empty', () => {
    expect(getMIME('')).toBe(null);
  });

  it('should return image/jpeg if binary starts with /', () => {
    expect(getMIME('/')).toBe('image/jpeg');
  });

  it('should return image/png if binary starts with i', () => {
    expect(getMIME('i')).toBe('image/png');
  });

  it('should return image/gif if binary starts with R', () => {
    expect(getMIME('R')).toBe('image/gif');
  });

  it('should return image/webp if binary starts with U', () => {
    expect(getMIME('U')).toBe('image/webp');
  });

  it('should return null if binary starts with anything else', () => {
    expect(getMIME('a')).toBe(null);
  });
});
