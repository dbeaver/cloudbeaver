/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { Text } from './Text.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

describe('Text Component', () => {
  it('renders children correctly', async () => {
    const { getByText } = renderInApp(<Text>Hello World</Text>);
    const text = await vi.waitFor(() => getByText('Hello World'));
    expect(text).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderInApp(<Text className="custom-class">Hello World</Text>);
    expect(container.getElementsByClassName('custom-class')).toHaveLength(1);
  });

  it('passes HTML attributes correctly', () => {
    const { container } = renderInApp(
      <Text id="custom-id" data-testid="custom-testid">
        Hello World
      </Text>,
    );

    const div = container.firstChild;
    expect(div).toHaveAttribute('id', 'custom-id');
    expect(div).toHaveAttribute('data-testid', 'custom-testid');
  });
});
