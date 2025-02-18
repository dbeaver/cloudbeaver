/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// // @ts-nocheck
// import { describe, expect, it } from '@jest/globals';
// import { waitFor } from '@testing-library/react';

// import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

// import { Text } from './Text.js';

// const app = createApp();

// describe('Text Component', () => {
//   it('renders children correctly', async () => {
//     const { getByText } = renderInApp(<Text>Hello World</Text>, app);
//     const text = await waitFor(() => getByText('Hello World'));
//     expect(text).toBeInTheDocument();
//   });

//   it('applies custom className', () => {
//     const { container } = renderInApp(<Text className="custom-class">Hello World</Text>, app);
//     expect(container.getElementsByClassName('custom-class')).toHaveLength(1);
//   });

//   it('passes HTML attributes correctly', () => {
//     const { container } = renderInApp(
//       <Text id="custom-id" data-testid="custom-testid">
//         Hello World
//       </Text>,
//       app,
//     );

//     const div = container.firstChild;
//     expect(div).toHaveAttribute('id', 'custom-id');
//     expect(div).toHaveAttribute('data-testid', 'custom-testid');
//   });
// });
