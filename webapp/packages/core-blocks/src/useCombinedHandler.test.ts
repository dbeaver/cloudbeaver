/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, vi, test, expect } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useCombinedHandler } from './useCombinedHandler.js';
import * as useObjectRefModule from './useObjectRef.js';

vi.mock('./useObjectRef', () => ({
  useObjectRef: vi.fn(value => value),
}));

describe('useCombinedHandler', () => {
  test('should call handler with args', () => {
    const handlerMock = vi.fn();
    vi.spyOn(useObjectRefModule, 'useObjectRef').mockImplementationOnce(() => ({
      handler: handlerMock,
    }));

    const handler1 = vi.fn();
    const handler2 = vi.fn();
    const handler3 = null;

    const { result } = renderHook(() => useCombinedHandler(handler1, handler2, handler3));

    const args = ['arg1', 'arg2'];
    result.current(...args);

    expect(handlerMock).toHaveBeenCalledWith(...args);
  });
});
