/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, test } from '@jest/globals';
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';

import { Icon } from './Icon';

test('icons.svg#name', async () => {
  (globalThis as any)._ROOT_URI_ = undefined;

  const { container } = render(<Icon data-testid="Icon" name="test" />);
  expect(container.querySelector('use')?.getAttribute('href')).toBe('/icons/icons.svg#test');
});

test('/image.jpg', () => {
  (globalThis as any)._ROOT_URI_ = undefined;

  const { container } = render(<Icon data-testid="Icon" name="/image.jpg" />);
  expect(container.querySelector('use')?.getAttribute('href')).toBe('/image.jpg');
});

test('{_ROOT_URI_}/icons.svg#name', () => {
  (globalThis as any)._ROOT_URI_ = '/path/';

  const { container } = render(<Icon data-testid="Icon" name="test" />);
  expect(container.querySelector('use')?.getAttribute('href')).toBe('/path/icons/icons.svg#test');
});
