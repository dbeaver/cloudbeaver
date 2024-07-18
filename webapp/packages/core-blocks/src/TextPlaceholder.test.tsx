/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';

import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { TextPlaceholder } from './TextPlaceholder';

const app = createApp();

describe('TextPlaceholder Component', () => {
  it('renders children correctly', async () => {
    renderInApp(<TextPlaceholder>Hello World</TextPlaceholder>, app);
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeTruthy();
    });
  });

  it('applies custom className', () => {
    const { container } = renderInApp(<TextPlaceholder className="custom-class">Hello World</TextPlaceholder>, app);
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });
});
