/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { TimerIcon } from './TimerIcon.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./Icon', () => ({
  Icon: (props: any) => <svg {...props}>Icon</svg>,
}));

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

describe('TimerIcon', () => {
  it('renders correctly with state "play" and interval 30', async () => {
    const { getByText, getByTestId } = renderInApp(<TimerIcon state="play" data-testid="timer-icon" interval={30} />);
    const text = await vi.waitFor(() => getByText('30'));

    const timerIcon = await vi.waitFor(() => getByTestId('timer-icon'));
    const icons = timerIcon.querySelectorAll('svg');
    const playIcon = Array.from(icons).find(icon => icon.getAttribute('name') === '/icons/timer-play_m.svg#root');

    expect(playIcon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it('renders correctly with state "stop" and interval 60', async () => {
    const { getByText, getByTestId } = renderInApp(<TimerIcon state="stop" data-testid="timer-icon" interval={60} />);
    const text = await vi.waitFor(() => getByText('60'));

    const timerIcon = await vi.waitFor(() => getByTestId('timer-icon'));
    const icons = timerIcon.querySelectorAll('svg');
    const stopIcon = Array.from(icons).find(icon => icon.getAttribute('name') === '/icons/timer-stop_m.svg#root');

    expect(stopIcon).toBeInTheDocument();
    expect(text).toBeInTheDocument();
  });

  it('passes HTML attributes correctly', () => {
    const { container } = renderInApp(<TimerIcon state="play" interval={30} id="custom-id" data-testid="custom-testid" />);

    const div = container.firstChild;
    expect(div).toHaveAttribute('id', 'custom-id');
    expect(div).toHaveAttribute('data-testid', 'custom-testid');
  });
});
