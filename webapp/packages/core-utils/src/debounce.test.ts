/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { debounce } from './debounce';

// https://jestjs.io/docs/timer-mocks
// Tell Jest to mock all timeout functions
jest.useFakeTimers();

describe('Debounce', () => {
  test('function should be executed just once', () => {
    const func = jest.fn();
    const debouncedFunction = debounce(func, 1000);

    debouncedFunction();
    debouncedFunction();
    debouncedFunction();

    // Fast-forward time
    jest.runAllTimers();

    expect(func).toBeCalledTimes(1);
  });
});