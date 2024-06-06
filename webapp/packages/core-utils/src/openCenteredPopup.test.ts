/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { openCenteredPopup } from './openCenteredPopup';

describe('openCenteredPopup', () => {
  let windowSpy: jest.SpyInstance;
  const params = {
    url: 'http://localhost:3000',
    target: 'target',
    width: 500,
    height: 500,
    features: 'features',
  };

  beforeEach(() => {
    windowSpy = jest.spyOn(window, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('should open centered popup', () => {
    const windowMock = {
      top: {
        outerWidth: 1000,
        screenY: 100,
        screenX: 100,
        outerHeight: 1000,
      },
      screen: {
        availWidth: 1000,
      },
      open: jest.fn(),
    };

    windowSpy.mockImplementation(() => windowMock);

    const { url, target, width, height, features } = params;

    const result = openCenteredPopup({ url, target, width, height, features });

    expect(result).toBe(windowMock.open());
    expect(windowMock.open).toHaveBeenCalledWith(
      url,
      target,
      `toolbar=no, menubar=no, width=${width}, height=${height}, top=350, left=350${features}`,
    );
  });

  it('should return null if window.top is null', () => {
    const { url, target, width, height, features } = params;

    windowSpy.mockImplementation(() => ({
      top: null,
    }));

    const result = openCenteredPopup({ url, target, width, height, features });

    expect(result).toBe(null);
  });
});
