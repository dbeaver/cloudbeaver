/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// // @ts-nocheck
// import { describe, expect, it } from '@jest/globals';
// import { queryByAttribute, waitFor } from '@testing-library/react';

// import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

// import { TimerIcon } from './TimerIcon.js';

// const app = createApp();

// describe('TimerIcon', () => {
//   it('renders correctly with state "play" and interval 30', async () => {
//     const { getByText, container } = renderInApp(<TimerIcon state="play" interval={30} />, app);
//     const text = await waitFor(() => getByText('30'));
//     const name = await waitFor(() => queryByAttribute('href', container, '/icons/timer-play_m.svg#root'));

//     expect(name).toBeInTheDocument();
//     expect(text).toBeInTheDocument();
//   });

//   it('renders correctly with state "stop" and interval 60', async () => {
//     const { getByText, container } = renderInApp(<TimerIcon state="stop" interval={60} />, app);
//     const text = await waitFor(() => getByText('60'));
//     const name = await waitFor(() => queryByAttribute('href', container, '/icons/timer-stop_m.svg#root'));

//     expect(name).toBeInTheDocument();
//     expect(text).toBeInTheDocument();
//   });

//   it('passes HTML attributes correctly', () => {
//     const { container } = renderInApp(<TimerIcon state="play" interval={30} id="custom-id" data-testid="custom-testid" />, app);

//     const div = container.firstChild;
//     expect(div).toHaveAttribute('id', 'custom-id');
//     expect(div).toHaveAttribute('data-testid', 'custom-testid');
//   });
// });
