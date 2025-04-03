/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import { Icon } from './Icon.js';
import { render } from '@testing-library/react';

vi.mock('@cloudbeaver/core-utils', () => ({
  GlobalConstants: {
    absoluteUrl: (name: string) => name,
  },
}));

describe('Icon', () => {
  test('/image.jpg', async () => {
    const { getByTestId } = render(<Icon data-testid="Icon" name="/image.jpg" />);
    const icon = await vi.waitFor(() => getByTestId('Icon'));
    expect(icon.querySelector('use')).toHaveAttribute('href', '/image.jpg');
  });
});
