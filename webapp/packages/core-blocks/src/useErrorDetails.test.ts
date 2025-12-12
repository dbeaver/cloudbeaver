/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it, vitest } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import * as coreDi from '@cloudbeaver/core-di';
import { DetailsError } from '@cloudbeaver/core-sdk';
import { LoadingError } from '@cloudbeaver/core-utils';
import * as coreUtils from '@cloudbeaver/core-utils';
import { useErrorDetails } from './useErrorDetails.js';
// eslint-disable-next-line @cloudbeaver/no-sync-component-import
import { ErrorDetailsDialog } from './ErrorDetailsDialog/ErrorDetailsDialog.js';

vitest.mock('@cloudbeaver/core-di', () => ({
  useService: vitest.fn(),
}));

vitest.mock('./ErrorDetailsDialog/ErrorDetailsDialog.js', () => ({
  ErrorDetailsDialog: vitest.fn(),
}));

vitest.mock('./localization/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

vitest.mock('@cloudbeaver/core-sdk', () => ({
  DetailsError: vitest.fn(Error),
}));

vitest.mock('@cloudbeaver/core-dialogs', () => ({
  CommonDialogService: vitest.fn(),
}));

class CommonDialogService {
  open = vitest.fn(() => Promise.resolve());
}

const getMocks = () => {
  const commonDialogServiceMock = new CommonDialogService();
  const errorOfMock = vitest.fn();

  vitest.spyOn(coreDi, 'useService').mockImplementation(() => commonDialogServiceMock);
  vitest.spyOn(coreUtils, 'errorOf').mockImplementation(errorOfMock);

  return {
    commonDialogServiceMock,
    errorOfMock,
  };
};

describe('useErrorDetails', () => {
  let mockErrorDetailsDialog: ReturnType<typeof vitest.fn>;

  beforeEach(() => {
    vitest.clearAllMocks();
    mockErrorDetailsDialog = ErrorDetailsDialog as unknown as ReturnType<typeof vitest.fn>;
  });

  it('should return null values when error is null', () => {
    const { errorOfMock } = getMocks();

    errorOfMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useErrorDetails(null));

    expect(result.current.error).toBeNull();
    expect(result.current.name).toBeUndefined();
    expect(result.current.message).toBeUndefined();
    expect(result.current.details).toBeUndefined();
    expect(result.current.hasDetails).toBe(false);
    expect(result.current.isOpen).toBe(false);
    expect(result.current.refresh).toBeUndefined();
  });

  it('should handle string error', () => {
    const { errorOfMock } = getMocks();

    const errorMessage = 'Something went wrong';
    errorOfMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useErrorDetails(errorMessage));

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.name).toBe('core_blocks_exception_message_error_message');
    expect(result.current.message).toBe(errorMessage);
    expect(result.current.details).toBeUndefined();
    expect(result.current.hasDetails).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle Error object', () => {
    const { errorOfMock } = getMocks();

    const error = new Error('Test error');
    errorOfMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.error).toBe(error);
    expect(result.current.name).toBe('Error');
    expect(result.current.message).toBe('Test error');
    expect(result.current.details).toBeUndefined();
    expect(result.current.hasDetails).toBe(false);
    expect(result.current.isOpen).toBe(false);
  });

  it('should extract DetailsError and check hasDetails', () => {
    const { errorOfMock } = getMocks();

    const detailsError = new DetailsError('Error with details');
    detailsError.hasDetails = vitest.fn().mockReturnValue(true);

    const error = new Error('Test error');

    errorOfMock.mockImplementation((err, errorType) => {
      if (errorType === DetailsError) {
        return detailsError;
      }
      return undefined;
    });

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.error).toBe(error);
    expect(result.current.details).toBe(detailsError);
    expect(result.current.hasDetails).toBe(true);
    expect(detailsError.hasDetails).toHaveBeenCalled();
  });

  it('should extract LoadingError and provide refresh function', () => {
    const { errorOfMock } = getMocks();

    const refreshMock = vitest.fn();
    const loadingError = new LoadingError(refreshMock);

    const error = new Error('Test error');

    errorOfMock.mockImplementation((err, errorType) => {
      if (errorType === LoadingError) {
        return loadingError;
      }
      return undefined;
    });

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.error).toBe(error);
    expect(result.current.refresh).toBe(loadingError.refresh);
  });

  it('should open error details dialog when open is called', async () => {
    const { errorOfMock, commonDialogServiceMock } = getMocks();

    const error = new Error('Test error');
    errorOfMock.mockReturnValue(undefined);

    commonDialogServiceMock.open.mockResolvedValue(undefined);

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.isOpen).toBe(false);

    await result.current.open();

    expect(commonDialogServiceMock.open).toHaveBeenCalledWith(mockErrorDetailsDialog, error);
    expect(result.current.isOpen).toBe(false);
  });

  it('should set isOpen to true while dialog is open', async () => {
    const { errorOfMock, commonDialogServiceMock } = getMocks();

    const error = new Error('Test error');
    errorOfMock.mockReturnValue(undefined);

    let resolveDialog: () => void;
    const dialogPromise = new Promise<void>(resolve => {
      resolveDialog = resolve;
    });

    commonDialogServiceMock.open.mockReturnValue(dialogPromise);

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.isOpen).toBe(false);

    const openPromise = result.current.open();

    await waitFor(() => {
      expect(result.current.isOpen).toBe(true);
    });

    expect(commonDialogServiceMock.open).toHaveBeenCalledWith(mockErrorDetailsDialog, error);

    resolveDialog!();
    await openPromise;

    await waitFor(() => {
      expect(result.current.isOpen).toBe(false);
    });
  });

  it('should not open dialog when error is null', async () => {
    const { errorOfMock, commonDialogServiceMock } = getMocks();

    errorOfMock.mockReturnValue(undefined);

    const { result } = renderHook(() => useErrorDetails(null));

    await result.current.open();

    expect(commonDialogServiceMock.open).not.toHaveBeenCalled();
    expect(result.current.isOpen).toBe(false);
  });

  it('should handle both DetailsError and LoadingError', () => {
    const { errorOfMock } = getMocks();

    const detailsError = new DetailsError('Error with details');
    detailsError.hasDetails = vitest.fn().mockReturnValue(true);

    const refreshMock = vitest.fn();
    const loadingError = new LoadingError(refreshMock);

    const error = new Error('Test error');

    errorOfMock.mockImplementation((err, errorType) => {
      if (errorType === DetailsError) {
        return detailsError;
      }
      if (errorType === LoadingError) {
        return loadingError;
      }
      return undefined;
    });

    const { result } = renderHook(() => useErrorDetails(error));

    expect(result.current.details).toBe(detailsError);
    expect(result.current.hasDetails).toBe(true);
    expect(result.current.refresh).toBe(loadingError.refresh);
  });

  it('should reset isOpen to false even if dialog throws error', async () => {
    const { errorOfMock, commonDialogServiceMock } = getMocks();

    const error = new Error('Test error');
    errorOfMock.mockReturnValue(undefined);

    const dialogError = new Error('Dialog error');
    commonDialogServiceMock.open.mockRejectedValue(dialogError);

    const { result } = renderHook(() => useErrorDetails(error));

    await expect(result.current.open()).rejects.toThrow('Dialog error');

    expect(result.current.isOpen).toBe(false);
  });
});
