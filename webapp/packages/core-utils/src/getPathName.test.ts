import { getPathName } from './getPathName';

jest.mock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/'),
}));

describe('getPathName', () => {
  it('should return the last part of the path', () => {
    expect(getPathName('/a/b/c')).toBe('c');
  });

  it('should return the path if it has no parts', () => {
    expect(getPathName('')).toBe('');
  });

  it('should return the path if it has only one part', () => {
    expect(getPathName('/a')).toBe('a');
  });

  it('should return same string if cannot divide it to full path', () => {
    expect(getPathName('abc')).toBe('abc');
  });
});
