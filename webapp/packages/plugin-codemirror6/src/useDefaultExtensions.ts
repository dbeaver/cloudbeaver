/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Extension } from '@codemirror/state';
import { useState } from 'react';

import { createComplexLoader, useComplexLoader } from '@cloudbeaver/core-blocks';

import type { IDefaultExtensions } from './getDefaultExtensions';

// chunk splitting
const getDefaultExtensionsLoader = createComplexLoader(() => import('./getDefaultExtensions').then(module => module.getDefaultExtensions));

export function useEditorDefaultExtensions(options?: IDefaultExtensions) {
  const getDefaultExtensions = useComplexLoader(getDefaultExtensionsLoader);
  const [extensions, setExtensions] = useState<Record<string, Extension>>({});

  const newExtensions = getDefaultExtensions(options);
  const diff: Record<string, 'add' | 'remove'> = {};

  for (const key in extensions) {
    if (!(key in newExtensions)) {
      diff[key] = 'remove';
    }
  }

  for (const key in newExtensions) {
    if (!(key in extensions)) {
      diff[key] = 'add';
    }
  }

  if (Object.keys(diff).length > 0) {
    const nextExtensions = { ...extensions };

    for (const key in diff) {
      if (diff[key] === 'add') {
        nextExtensions[key] = newExtensions[key];
      } else {
        delete nextExtensions[key];
      }
    }

    setExtensions(nextExtensions);
  }

  return Object.values(extensions);
}
