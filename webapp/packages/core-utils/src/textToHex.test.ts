import { textToHex } from './textToHex';

const value = 'test value';

describe('textToHex', () => {
  it('should return a hex string', () => {
    expect(textToHex(value)).toBe('746573742076616C7565');
  });

  it('should return an empty string', () => {
    expect(textToHex('')).toBe('');
  });
});
