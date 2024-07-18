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

import { Text } from './Text';

const app = createApp();

describe('Text Component', () => {
  it('renders children correctly', async () => {
    renderInApp(<Text>Hello World</Text>, app);
    await waitFor(() => {
      expect(screen.getByText('Hello World')).toBeTruthy();
    });
  });

  it('applies custom className', () => {
    const { container } = renderInApp(<Text className="custom-class">Hello World</Text>, app);
    expect(container.getElementsByClassName('custom-class').length).toBe(1);
  });

  it('passes HTML attributes correctly', () => {
    renderInApp(
      <Text id="custom-id" data-testid="custom-testid">
        Hello World
      </Text>,
      app,
    );

    const element = screen.getByTestId('custom-testid');
    expect(element.id).toBe('custom-id');
    expect(element.getAttribute('data-testid')).toBe('custom-testid');
  });
});
