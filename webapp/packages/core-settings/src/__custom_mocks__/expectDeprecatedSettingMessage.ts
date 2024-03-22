/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { addKnownWarn, consoleSpy } from '@cloudbeaver/tests-runner';

beforeAll(async () => {
  addKnownWarn(/You are using deprecated settings.*/);
});

export function expectDeprecatedSettingMessage(deprecated?: string, key?: string) {
  if (deprecated && key) {
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringMatching(`You are using deprecated settings: "${deprecated}". Use "${key}" instead.`));
  } else {
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringMatching(/You are using deprecated settings.*/));
  }
}

export function expectNoDeprecatedSettingMessage() {
  expect(consoleSpy.warn).not.toHaveBeenCalledWith(expect.stringMatching(/You are using deprecated settings.*/));
}
