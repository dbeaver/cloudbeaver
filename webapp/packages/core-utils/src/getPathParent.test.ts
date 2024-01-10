import { getPathParent } from './getPathParent';

jest.mock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/'),
  createPath: (...parts: string[]) => parts.join('/'),
}));

describe('getPathParent', () => {
  it('should return the parent path', () => {
    expect(getPathParent('/a/b/c')).toBe('a/b');
  });

  it('should return the parent path if it has no parts', () => {
    expect(getPathParent('')).toBe('');
  });

  it('should return the parent path if it has only one part', () => {
    expect(getPathParent('/a')).toBe('');
  });

  it('should return same string if cannot divide it to full path', () => {
    expect(getPathParent('abc')).toBe('');
  });
});
