/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
export const KNOWN_PEER_DEPS_MAP: Record<string, string[]> = {
  'mobx-react-lite': ['mobx', 'react-dom'],
  '@testing-library/react': ['@testing-library/dom', 'react-dom'],
  inversify: ['reflect-metadata'],
  '@typescript-eslint/eslint-plugin': ['typescript'],
  'react-minisearch': ['minisearch'],
};
