/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { GlobalConstants } from '@cloudbeaver/core-utils';
import { type Transport, LSPClient, languageServerExtensions } from '@cloudbeaver/plugin-codemirror6';

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
      console.log('[LSP] WebSocket connected');
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

@injectable()
export class LSPConnectionService {
  private client: LSPClient | null = null;
  private transport: IReconnectingTransport | null = null;
  private refCount = 0;

  acquire(): LSPClient {
    if (!this.client) {
      this.client = new LSPClient({
        extensions: languageServerExtensions(),
      });

      const url = GlobalConstants.absoluteServiceWSUrl(LSP_ENDPOINT);
      this.transport = createReconnectingTransport(url);
      this.client.connect(this.transport);
    }

    this.refCount++;
    return this.client;
  }

  release(): void {
    this.refCount--;

    if (this.refCount <= 0) {
      this.transport?.dispose();
      this.client = null;
      this.transport = null;
      this.refCount = 0;
    }
  }
}
