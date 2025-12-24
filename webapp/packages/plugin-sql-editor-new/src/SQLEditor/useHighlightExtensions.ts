/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import { createLazyLoader, useLazyImport } from '@cloudbeaver/core-blocks';
import type { Compartment, Extension } from '@cloudbeaver/plugin-codemirror6';

const codemirrorPluginLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));

export function useHighlightExtensions(enabled: boolean): [Compartment, Extension][] | null {
  const codemirror = useLazyImport(codemirrorPluginLoader);

  return useMemo(() => {
    if (!codemirror || !enabled) {
      return null;
    }

    const extensions = [codemirror.highlightWhitespace(), codemirror.highlightNewLine()];

    return extensions.map(extension => [new codemirror.Compartment(), extension] as [Compartment, Extension]);
  }, [codemirror, enabled]);
}
