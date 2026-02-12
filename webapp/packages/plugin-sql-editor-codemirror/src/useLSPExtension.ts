/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useMemo } from 'react';

import { createLazyLoader, useLazyImport } from '@cloudbeaver/core-blocks';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import { type Compartment, type Extension, type Transport, LSPClient, languageServerExtensions } from '@cloudbeaver/plugin-codemirror6';

const codemirrorPluginLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));

const LSP_ENDPOINT = 'ws/lsp';

function simpleWebSocketTransport(uri: string): Promise<Transport> {
  let handlers: ((value: string) => void)[] = [];
  const sock = new WebSocket(uri);

  sock.onmessage = e => {
    handlers.forEach(h => h(e.data as string));
  };

  sock.onerror = e => {
    console.error('[LSP] WebSocket error:', e);
  };

  sock.onclose = () => {
    console.log('[LSP] WebSocket connection closed');
  };

  return new Promise((resolve, reject) => {
    sock.onopen = () => {
      console.log('[LSP] WebSocket connection established');
      resolve({
        send(message: string) {
          sock.send(message);
        },
        subscribe(handler) {
          handlers.push(handler);
        },
        unsubscribe(handler) {
          handlers = handlers.filter(h => h !== handler);
        },
      });
    };

    sock.onerror = e => {
      console.error('[LSP] Failed to connect to WebSocket:', e);
      reject(e);
    };
  });
}

export interface ILSPExtensionOptions {
  projectId: string | null | undefined;
  resourcePath: string | null | undefined;
}

export function useLSPExtension(options: ILSPExtensionOptions): [Compartment, Extension] | null {
  const { projectId, resourcePath } = options;
  const codemirror = useLazyImport(codemirrorPluginLoader);

  const LSP_COMPARTMENT = useMemo(() => {
    if (!codemirror) {
      return null;
    }
    return new codemirror.Compartment();
  }, [codemirror]);

  const client = useMemo(() => {
    const lspClient = new LSPClient({
      extensions: languageServerExtensions(),
    });

    const lspServerUrl = GlobalConstants.absoluteServiceWSUrl(LSP_ENDPOINT);

    simpleWebSocketTransport(lspServerUrl)
      .then(transport => {
        lspClient.connect(transport);
      })
      .catch(error => {
        console.error('[LSP] Failed to initialize LSP client:', error);
      });

    return lspClient;
  }, []);

  const documentUri = useMemo(() => {
    if (!projectId || !resourcePath) {
      return null;
    }
    return `lsp://${projectId}/${resourcePath}`;
  }, [projectId, resourcePath]);

  return useMemo(() => {
    if (!LSP_COMPARTMENT || !client || !codemirror || !documentUri) {
      return null;
    }

    return [LSP_COMPARTMENT, client.plugin(documentUri)];
  }, [LSP_COMPARTMENT, client, codemirror, documentUri]);
}
