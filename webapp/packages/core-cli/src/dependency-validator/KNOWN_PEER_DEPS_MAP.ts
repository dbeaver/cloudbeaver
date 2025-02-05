export const KNOWN_PEER_DEPS_MAP: Record<string, string[]> = {
  'mobx-react-lite': ['mobx', 'react-dom'],
  '@testing-library/react': ['@testing-library/dom', 'react-dom'],
  inversify: ['reflect-metadata'],
  '@typescript-eslint/eslint-plugin': ['typescript'],
  'react-minisearch': ['minisearch'],
};
