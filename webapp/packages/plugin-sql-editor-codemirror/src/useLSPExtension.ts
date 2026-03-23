/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useMemo } from 'react';

import { createLazyLoader, useLazyImport } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type Compartment, type Extension } from '@cloudbeaver/plugin-codemirror6';

import { LSPConnectionService } from './LSPConnectionService.js';

const codemirrorPluginLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));

export interface ILSPExtensionOptions {
  documentUri: string | null | undefined;
}

export function useLSPExtension(options: ILSPExtensionOptions): [Compartment, Extension] | null {
  const { documentUri } = options;
  const codemirror = useLazyImport(codemirrorPluginLoader);
  const lspConnectionService = useService(LSPConnectionService);

  const LSP_COMPARTMENT = useMemo(() => {
    if (!codemirror) {
      return null;
    }
    return new codemirror.Compartment();
  }, [codemirror]);

  const client = useMemo(() => lspConnectionService.acquire(), [lspConnectionService]);

  useEffect(() => () => lspConnectionService.release(), [lspConnectionService]);

  return useMemo(() => {
    if (!LSP_COMPARTMENT || !client || !codemirror || !documentUri) {
      return null;
    }

    return [LSP_COMPARTMENT, client.plugin(documentUri)];
  }, [LSP_COMPARTMENT, client, codemirror, documentUri]);
}
