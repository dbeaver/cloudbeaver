/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { addKnownInfo, consoleSpy } from '@cloudbeaver/tests-runner';

beforeAll(async () => {
  addKnownInfo(/Websocket closed.*/);
});

export function expectWebsocketClosedMessage() {
  expect(consoleSpy.info).toHaveBeenCalledWith(expect.stringMatching(/Websocket closed.*/));
}

export function expectNoWebsocketClosedMessage() {
  expect(consoleSpy.info).not.toHaveBeenCalledWith(expect.stringMatching(/Websocket closed.*/));
}
