import { getPathParents } from './getPathParents';

jest.mock('./createPath', () => ({
  createPath: (...args: string[]) => args.join('/'),
}));

jest.mock('./getPathParts', () => ({
  getPathParts: (path: string) => path.split('/').filter(Boolean),
}));

describe('getPathParents', () => {
  it('should return all path parents ', () => {
    expect(getPathParents('/a/b/c')).toStrictEqual(['', 'a', 'a/b']);
  });

  it('should return empty array', () => {
    expect(getPathParents('')).toStrictEqual([]);
  });

  it('should return 1 parent', () => {
    expect(getPathParents('/a')).toStrictEqual(['']);
  });

  it('should return empty array with only letters', () => {
    expect(getPathParents('abc')).toStrictEqual(['']);
  });

  it('should return empty array with only /', () => {
    expect(getPathParents('/')).toStrictEqual([]);
  });
});
