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

import { Cell } from './Cell';

const app = createApp();

describe('Cell', () => {
  it('should render children correctly', async () => {
    const { getByText } = renderInApp(<Cell>Test Children</Cell>, app);
    const text = (await waitFor(() => getByText('Test Children'))) as HTMLElement;

    expect(await screen.findByText('Test Children')).toBe(text);
  });

  it('should render before element correctly', async () => {
    const { getByText } = renderInApp(<Cell before={<span>Before Element</span>}>Test Children</Cell>, app);

    const beforeText = await waitFor(() => getByText('Before Element'));

    expect(await screen.findByText('Before Element')).toBe(beforeText);
  });

  it('should render after element correctly', async () => {
    const { getByText } = renderInApp(<Cell after={<span>After Element</span>}>Test Children</Cell>, app);

    const afterText = await waitFor(() => getByText('After Element'));
    expect(await screen.findByText('After Element')).toBe(afterText);
  });

  it('should render after and before elements correctly', async () => {
    const { getByText } = renderInApp(
      <Cell before={<span>Before Element</span>} after={<span>After Element</span>}>
        Test Children
      </Cell>,
      app,
    );

    const afterText = await waitFor(() => getByText('After Element'));
    const beforeText = await waitFor(() => getByText('Before Element'));

    expect(await screen.findByText('After Element')).toBe(afterText);
    expect(await screen.findByText('Before Element')).toBe(beforeText);
  });

  it('should render description element correctly', async () => {
    const { getByText } = renderInApp(<Cell description={<span>Description Element</span>}>Test Children</Cell>, app);

    const description = await waitFor(() => getByText('Description Element'));

    expect(await screen.findByText('Description Element')).toBe(description);
  });
});
