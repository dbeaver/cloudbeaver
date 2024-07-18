/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it } from '@jest/globals';
import { queryByAttribute, screen, waitFor } from '@testing-library/react';

import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { TimerIcon } from './TimerIcon';

const app = createApp();

describe('TimerIcon', () => {
  it('renders correctly with state "play" and interval 30', async () => {
    const { container } = renderInApp(<TimerIcon state="play" interval={30} />, app);
    await waitFor(() => {
      expect(screen.getByText('30')).toBeTruthy();
      expect(queryByAttribute('href', container, '/icons/timer-play_m.svg#root')).toBeTruthy();
    });
  });

  it('renders correctly with state "stop" and interval 60', async () => {
    const { container } = renderInApp(<TimerIcon state="stop" interval={60} />, app);
    await waitFor(() => {
      expect(screen.getByText('60')).toBeTruthy();
      expect(queryByAttribute('href', container, '/icons/timer-stop_m.svg#root')).toBeTruthy();
    });
  });

  it('passes HTML attributes correctly', () => {
    renderInApp(<TimerIcon state="play" interval={30} id="custom-id" data-testid="custom-testid" />, app);

    const element = screen.getByTestId('custom-testid');
    expect(element.id).toBe('custom-id');
    expect(element.getAttribute('data-testid')).toBe('custom-testid');
  });
});
