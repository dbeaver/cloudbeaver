/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// @ts-nocheck
import { afterEach, describe, expect, test } from '@jest/globals';
import { cleanup, render, screen } from '@testing-library/react';

import { Icon } from './Icon.js';

describe('Icon', () => {
  afterEach(() => {
    cleanup();
  });

  test('icons.svg#name', () => {
    (globalThis as any)._ROOT_URI_ = undefined;

    render(<Icon data-testid="Icon" name="test" />);
    expect(screen.getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/icons/icons.svg#test');
  });

  test('/image.jpg', () => {
    (globalThis as any)._ROOT_URI_ = undefined;

    render(<Icon data-testid="Icon" name="/image.jpg" />);
    expect(screen.getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/image.jpg');
  });

  test('{_ROOT_URI_}/icons.svg#name', () => {
    (globalThis as any)._ROOT_URI_ = '/path/';

    render(<Icon data-testid="Icon" name="test" />);
    expect(screen.getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/path/icons/icons.svg#test');
  });
});
