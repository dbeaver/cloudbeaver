/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ws } from 'msw';

export function createWebsocketEndpoint() {
  const chat = ws.link('http://localhost/api/ws');

  return [
    chat.addEventListener('connection', ({ client }) => {
      client.addEventListener('message', event => {
        console.log('Received message from client:', event.data);
      });
    }),
  ];
}
