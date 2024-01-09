import { getPathParts } from './getPathParts';

describe('getPathParts', () => {
  it('should return full parts', () => {
    expect(getPathParts('/a/b/c')).toStrictEqual(['', 'a', 'b', 'c']);
  });

  it('should return empty part', () => {
    expect(getPathParts('')).toStrictEqual(['']);
  });

  it('should return 2 parts', () => {
    expect(getPathParts('/a')).toStrictEqual(['', 'a']);
  });

  it('should return same string in array', () => {
    expect(getPathParts('abc')).toStrictEqual(['abc']);
  });
});
