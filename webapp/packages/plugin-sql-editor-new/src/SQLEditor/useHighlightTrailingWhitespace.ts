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

export function useHighlightTrailingWhitespace(enabled: boolean): [Compartment, Extension] | null {
  const codemirror = useLazyImport(codemirrorPluginLoader);

  const HIGHLIGHT_TRAILING_SPACE_COMPARTMENT = useMemo(() => {
    if (!codemirror) {
      return null;
    }
    return new codemirror.Compartment();
  }, [codemirror]);

  return useMemo(() => {
    if (!codemirror || !HIGHLIGHT_TRAILING_SPACE_COMPARTMENT || !enabled) {
      return null;
    }

    return [HIGHLIGHT_TRAILING_SPACE_COMPARTMENT, codemirror.highlightTrailingWhitespace()];
  }, [HIGHLIGHT_TRAILING_SPACE_COMPARTMENT, codemirror, enabled]);
}
