/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useEffect, useMemo } from 'react';

import { createLazyLoader, useLazyImport } from '@cloudbeaver/core-blocks';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import { type Compartment, type Extension, type Transport, LSPClient, languageServerExtensions } from '@cloudbeaver/plugin-codemirror6';

const codemirrorPluginLoader = createLazyLoader(() => import('@cloudbeaver/plugin-codemirror6'));

const LSP_ENDPOINT = 'ws/lsp';
const RECONNECT_BASE_DELAY = 1000;
const MAX_RECONNECT_ATTEMPTS = 5;

interface IReconnectingTransport extends Transport {
  dispose(): void;
}

function createReconnectingTransport(uri: string): IReconnectingTransport {
  let handlers: ((value: string) => void)[] = [];
  let sock: WebSocket | null = null;
  let reconnectAttempts = 0;
  let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  let disposed = false;

  function connect() {
    if (disposed) {
      return;
    }

    sock = new WebSocket(uri);

    sock.onopen = () => {
      reconnectAttempts = 0;
    };

    sock.onmessage = e => {
      handlers.forEach(h => h(e.data as string));
    };

    sock.onclose = () => {
      if (disposed) {
        return;
      }

      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_BASE_DELAY * 2 ** (reconnectAttempts - 1);
        console.warn(`[LSP] WebSocket closed, reconnecting in ${delay}ms (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);
        reconnectTimeout = setTimeout(connect, delay);
      } else {
        console.error('[LSP] Max reconnect attempts reached');
      }
    };

    sock.onerror = e => {
      console.error('[LSP] WebSocket error:', e);
    };
  }

  connect();

  return {
    send(message: string) {
      if (sock?.readyState === WebSocket.OPEN) {
        sock.send(message);
      }
    },
    subscribe(handler) {
      handlers.push(handler);
    },
    unsubscribe(handler) {
      handlers = handlers.filter(h => h !== handler);
    },
    dispose() {
      disposed = true;

      if (reconnectTimeout !== null) {
        clearTimeout(reconnectTimeout);
      }

      if (sock) {
        sock.close();
        sock = null;
      }

      handlers = [];
    },
  };
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

  const { client, transport } = useMemo(() => {
    const lspClient = new LSPClient({
      extensions: languageServerExtensions(),
    });

    const lspServerUrl = GlobalConstants.absoluteServiceWSUrl(LSP_ENDPOINT);
    const lspTransport = createReconnectingTransport(lspServerUrl);

    lspClient.connect(lspTransport);

    return { client: lspClient, transport: lspTransport };
  }, []);

  useEffect(
    () => () => {
      transport.dispose();
    },
    [transport],
  );

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
