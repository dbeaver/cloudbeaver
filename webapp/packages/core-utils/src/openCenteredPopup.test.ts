/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { openCenteredPopup } from './openCenteredPopup';

describe('openCenteredPopup', () => {
  it('opens centered popup', () => {
    const url = 'http://localhost:3000';
    const target = 'target';
    const width = 500;
    const height = 500;
    const features = 'features';
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

    const result = openCenteredPopup({ url, target, width, height, features });

    expect(result).toBe(windowMock.open(url, target, `toolbar=no, menubar=no, width=${width / 2}, height=${height / 2}, top=50, left=50${features}`));
  });

  it('returns null if window.top is null', () => {
    const url = 'http://localhost:3000';
    const target = 'target';
    const width = 500;
    const height = 500;
    const features = 'features';
    jest.spyOn(window, 'top', 'get').mockReturnValue(null);

    const result = openCenteredPopup({ url, target, width, height, features });

    expect(result).toBe(null);
  });
});
