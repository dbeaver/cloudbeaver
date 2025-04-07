/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeAll, expect } from 'vitest';

import { addKnownInfo, consoleSpy } from '@cloudbeaver/tests-runner';

const WEBSOCKET_CLOSED_MESSAGE_REGEX = /Websocket closed.*/;

beforeAll(() => {
  addKnownInfo(WEBSOCKET_CLOSED_MESSAGE_REGEX);
});

export function expectWebsocketClosedMessage() {
  expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringMatching(WEBSOCKET_CLOSED_MESSAGE_REGEX));
}

export function expectNoWebsocketClosedMessage() {
  expect(consoleSpy.info).not.toHaveBeenCalledWith(expect.stringMatching(WEBSOCKET_CLOSED_MESSAGE_REGEX));
}
