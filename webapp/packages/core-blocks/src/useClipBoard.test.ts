/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

import * as coreDi from '@cloudbeaver/core-di';
import * as coreUtils from '@cloudbeaver/core-utils';

import { useClipboard } from './useClipboard.js';

jest.mock('@cloudbeaver/core-utils', () => ({
  copyToClipboard: jest.fn(),
}));

jest.mock('@cloudbeaver/core-di', () => ({
  useService: jest.fn(),
}));

jest.mock('@cloudbeaver/core-events', () => ({
  NotificationService: {},
}));

class NotificationService {
  logSuccess = jest.fn();
  logException = jest.fn();
}

const getMocks = () => {
  const copyToClipboardMock = jest.fn();
  const notificationServiceMock = new NotificationService();

  jest.spyOn(coreUtils, 'copyToClipboard').mockImplementation(copyToClipboardMock);
  jest.spyOn(coreDi, 'useService').mockImplementation(() => notificationServiceMock);

  return {
    copyToClipboardMock,
    notificationServiceMock,
  };
};

describe.skip('useClipboard', () => {
  const VALUE_TO_COPY = 'test';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should copy without notification', async () => {
    const { notificationServiceMock, copyToClipboardMock } = getMocks();

    const { result } = renderHook(() => useClipboard());

    result.current(VALUE_TO_COPY);
    expect(copyToClipboardMock).toHaveBeenCalledWith(VALUE_TO_COPY);

    result.current(VALUE_TO_COPY, false);

    expect(copyToClipboardMock).toHaveBeenCalledWith(VALUE_TO_COPY);
    expect(copyToClipboardMock).toHaveBeenCalledTimes(2);

    expect(notificationServiceMock.logSuccess).not.toHaveBeenCalled();
    expect(notificationServiceMock.logException).not.toHaveBeenCalled();
  });

  it('should copy with notification', async () => {
    const { notificationServiceMock, copyToClipboardMock } = getMocks();

    const { result } = renderHook(() => useClipboard());

    result.current(VALUE_TO_COPY, true);

    expect(copyToClipboardMock).toHaveBeenCalledWith(VALUE_TO_COPY);
    expect(notificationServiceMock.logSuccess).toHaveBeenCalledWith({ title: 'ui_copy_to_clipboard_copied' });
    expect(notificationServiceMock.logException).not.toHaveBeenCalled();
  });

  it('should handle exception while trying to copy', async () => {
    const { notificationServiceMock, copyToClipboardMock } = getMocks();

    const { result } = renderHook(() => useClipboard());
    const exception = new Error('test');

    copyToClipboardMock.mockImplementation(() => {
      throw exception;
    });

    result.current(VALUE_TO_COPY, true);

    expect(copyToClipboardMock).toHaveBeenCalledWith(VALUE_TO_COPY);
    expect(notificationServiceMock.logSuccess).not.toHaveBeenCalled();
    expect(notificationServiceMock.logException).toHaveBeenCalledWith(exception, 'ui_copy_to_clipboard_failed_to_copy');
  });
});
