/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import { Icon } from './Icon.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('@cloudbeaver/core-utils', () => ({
  GlobalConstants: {
    absoluteUrl: (name: string) => name,
  },
}));

describe('Icon', () => {
  test('icons.svg#name', () => {
    (globalThis as any)._ROOT_URI_ = undefined;

    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="test" />);
    expect(getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/icons/icons.svg#test');
  });

  test('/image.jpg', () => {
    (globalThis as any)._ROOT_URI_ = undefined;

    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="/image.jpg" />);
    expect(getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/image.jpg');
  });

  test('{_ROOT_URI_}/icons.svg#name', () => {
    (globalThis as any)._ROOT_URI_ = '/path/';

    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="test" />);
    expect(getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/icons/icons.svg#test');
  });
});
