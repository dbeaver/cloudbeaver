/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

import { Icon } from './Icon.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

describe('Icon', () => {
  beforeAll(() => {
    (globalThis as any)._ROOT_URI_ = '/path/';
  });

  afterAll(() => {
    (globalThis as any)._ROOT_URI_ = undefined;
  });

  test('should render with "icons.svg#name" path', () => {
    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="test" />);
    expect(getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/path/icons/preload/icons.svg#test');
  });

  test('should render with custom absolute path', () => {
    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="/image.jpg" />);
    expect(getByTestId('Icon').querySelector('use')).toHaveAttribute('href', '/path/image.jpg');
  });
});
