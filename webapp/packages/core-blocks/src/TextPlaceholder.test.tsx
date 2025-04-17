/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { TextPlaceholder } from './TextPlaceholder.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

describe('TextPlaceholder Component', () => {
  it('renders children correctly', async () => {
    const { getByText } = renderInApp(<TextPlaceholder>Hello World</TextPlaceholder>);
    const text = await vi.waitFor(() => getByText('Hello World'));
    expect(text).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderInApp(<TextPlaceholder className="custom-class">Hello World</TextPlaceholder>);
    expect(container.getElementsByClassName('custom-class')).toHaveLength(1);
  });
});
