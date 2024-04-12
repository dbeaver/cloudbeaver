/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { addKnownWarn, consoleSpy } from '@cloudbeaver/tests-runner';

const DEPRECATED_SETTING_MESSAGE_REGEX = /You have deprecated settings:*/;

beforeAll(async () => {
  addKnownWarn(DEPRECATED_SETTING_MESSAGE_REGEX);
});

export function expectDeprecatedSettingMessage(deprecated?: string, key?: string) {
  if (deprecated && key) {
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringMatching(`You have deprecated settings: "${deprecated}". Use "${key}" instead.`));
  } else {
    expect(consoleSpy.warn).toHaveBeenCalledWith(expect.stringMatching(DEPRECATED_SETTING_MESSAGE_REGEX));
  }
}

export function expectNoDeprecatedSettingMessage() {
  expect(consoleSpy.warn).not.toHaveBeenCalledWith(expect.stringMatching(DEPRECATED_SETTING_MESSAGE_REGEX));
}
