/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// // @ts-nocheck
// import { afterEach, describe, expect, it } from '@jest/globals';
// import { cleanup, waitFor } from '@testing-library/react';

// import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

// import { Cell } from './Cell.js';

// const app = createApp();

// describe('Cell', () => {
//   afterEach(() => {
//     cleanup();
//   });

//   it('should render children correctly', async () => {
//     const { getByText } = renderInApp(<Cell>Test Children</Cell>, app);
//     const text = await waitFor(() => getByText('Test Children'));

//     expect(text).toBeInTheDocument();
//   });

//   it('should render before element correctly', async () => {
//     const { getByText } = renderInApp(<Cell before={<span>Before Element</span>}>Test Children</Cell>, app);

//     const beforeText = await waitFor(() => getByText('Before Element'));
//     expect(beforeText).toBeInTheDocument();
//   });

//   it('should render after element correctly', async () => {
//     const { getByText } = renderInApp(<Cell after={<span>After Element</span>}>Test Children</Cell>, app);

//     const afterText = await waitFor(() => getByText('After Element'));
//     expect(afterText).toBeInTheDocument();
//   });

//   it('should render after and before elements correctly', async () => {
//     const { getByText } = renderInApp(
//       <Cell before={<span>Before Element</span>} after={<span>After Element</span>}>
//         Test Children
//       </Cell>,
//       app,
//     );

//     const afterText = await waitFor(() => getByText('After Element'));
//     const beforeText = await waitFor(() => getByText('Before Element'));

//     expect(beforeText).toBeInTheDocument();
//     expect(afterText).toBeInTheDocument();
//   });

//   it('should render description element correctly', async () => {
//     const { getByText } = renderInApp(<Cell description={<span>Description Element</span>}>Test Children</Cell>, app);

//     const description = await waitFor(() => getByText('Description Element'));
//     expect(description).toBeInTheDocument();
//   });
// });
