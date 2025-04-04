/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { describe, expect, it, vi } from 'vitest';
import { Cell } from './Cell.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

vi.mock('./Containers/Container', () => ({
  Container: (props: any) => <div {...props}>{props.children}</div>,
}));

describe('Cell', () => {
  it('should render children correctly', async () => {
    const { getByText } = renderInApp(<Cell>Test Children</Cell>);
    const text = await vi.waitFor(() => getByText('Test Children'));

    expect(text).toBeInTheDocument();
  });

  it('should render before element correctly', async () => {
    const { getByText } = renderInApp(<Cell before={<span>Before Element</span>}>Test Children</Cell>);

    const beforeText = await vi.waitFor(() => getByText('Before Element'));
    expect(beforeText).toBeInTheDocument();
  });

  it('should render after element correctly', async () => {
    const { getByText } = renderInApp(<Cell after={<span>After Element</span>}>Test Children</Cell>);

    const afterText = await vi.waitFor(() => getByText('After Element'));
    expect(afterText).toBeInTheDocument();
  });

  it('should render after and before elements correctly', async () => {
    const { getByText } = renderInApp(
      <Cell before={<span>Before Element</span>} after={<span>After Element</span>}>
        Test Children
      </Cell>,
    );

    const afterText = await vi.waitFor(() => getByText('After Element'));
    const beforeText = await vi.waitFor(() => getByText('Before Element'));

    expect(beforeText).toBeInTheDocument();
    expect(afterText).toBeInTheDocument();
  });

  it('should render description element correctly', async () => {
    const { getByText } = renderInApp(<Cell description={<span>Description Element</span>}>Test Children</Cell>);

    const description = await vi.waitFor(() => getByText('Description Element'));
    expect(description).toBeInTheDocument();
  });
});
