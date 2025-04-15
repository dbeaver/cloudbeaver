/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from 'vitest';

import { getFirstException, type ILoadableState, isContainsException, isLoadableStateHasException } from './ILoadableState.js';

const getMockedLoadableState = (state: Partial<ILoadableState>): ILoadableState => ({
  exception: null,
  isLoading: () => false,
  isLoaded: () => false,
  isError: () => false,
  load: () => undefined,
  ...state,
});

describe('isContainsException', () => {
  it('should return true if exception is present', () => {
    expect(isContainsException(new Error())).toBe(true);
  });

  it('should return false if exception is not present', () => {
    expect(isContainsException(null)).toBe(false);
  });

  it('should check array of exceptions', () => {
    expect(isContainsException([null, new Error()])).toBe(true);
    expect(isContainsException([null, null])).toBe(false);
    expect(isContainsException([])).toBe(false);
  });
});

describe('getFirstException', () => {
  it('should return first exception', () => {
    const error = new Error();
    const error2 = new Error('error2');

    expect(getFirstException([null, error, error2])).toBe(error);
    expect(getFirstException([null, error])).toBe(error);
    expect(getFirstException([error])).toBe(error);
    expect(getFirstException(error)).toBe(error);
  });

  it('should not get exception', () => {
    expect(getFirstException([null, null])).toBe(null);
    expect(getFirstException([null])).toBe(null);
    expect(getFirstException([])).toBe(null);
    expect(getFirstException(null)).toBe(null);
  });
});

describe('isLoadableStateHasException', () => {
  it('should return true if exception is present', () => {
    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: [new Error(), new Error('error2')],
          isError() {
            return true;
          },
        }),
      ),
    ).toBe(true);

    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: [new Error()],
          isError() {
            return true;
          },
        }),
      ),
    ).toBe(true);

    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: new Error(),
          isError() {
            return true;
          },
        }),
      ),
    ).toBe(true);

    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: [null, new Error()],
          isError() {
            return true;
          },
        }),
      ),
    ).toBe(true);
  });

  it('should return false if exception is not present', () => {
    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: [],
          isError() {
            return false;
          },
        }),
      ),
    ).toBe(false);

    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: null,
          isError() {
            return false;
          },
        }),
      ),
    ).toBe(false);

    expect(
      isLoadableStateHasException(
        getMockedLoadableState({
          exception: [null, null],
          isError() {
            return false;
          },
        }),
      ),
    ).toBe(false);
  });
});
