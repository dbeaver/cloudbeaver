/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
// // @ts-nocheck
// import { describe, expect, it, jest } from '@jest/globals';
// import { fireEvent, queryByAttribute, waitFor } from '@testing-library/react';

// import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
// import { ENotificationType } from '@cloudbeaver/core-events';
// import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
// import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

// import { StatusMessage } from './StatusMessage.js';

// const app = createApp(coreLocalizationManifest, coreDialogsManifest);

// describe('StatusMessage', () => {
//   it('should display an error icon and message when type is error', async () => {
//     const message = 'test_error';
//     const { container, getByTitle } = renderInApp(<StatusMessage message={message} type={ENotificationType.Error} />, app);
//     const title = await waitFor(() => getByTitle(message));
//     const icon = await waitFor(() => queryByAttribute('src', container, /error/i));

//     expect(title).toBeInTheDocument();
//     expect(icon).toBeInTheDocument();
//   });

//   it('should display a success icon and message when type is success', async () => {
//     const message = 'test_success';
//     const { container, getByTitle } = renderInApp(<StatusMessage message={message} type={ENotificationType.Success} />, app);
//     const title = await waitFor(() => getByTitle(message));
//     const icon = await waitFor(() => queryByAttribute('src', container, /success/i));

//     expect(title).toBeInTheDocument();
//     expect(icon).toBeInTheDocument();
//   });

//   it('should display an error message when no message is provided', async () => {
//     const { getByText } = renderInApp(<StatusMessage exception={new Error('Test error')} />, app);
//     const message = await waitFor(() => getByText('Test error'));

//     expect(message).toBeInTheDocument();
//   });

//   it('should call onShowDetails when link is clicked', async () => {
//     const onShowDetails = jest.fn();
//     const message = 'test_message_with_details';
//     const { getByText } = renderInApp(<StatusMessage message={message} onShowDetails={onShowDetails} />, app);
//     const link = await waitFor(() => getByText(message));

//     fireEvent.click(link);
//     expect(onShowDetails).toHaveBeenCalled();
//   });

//   it('should display multiple messages joined by comma', async () => {
//     const messages = ['message_one', 'message_two'];
//     const { getByText } = renderInApp(<StatusMessage message={messages} />, app);
//     const message = await waitFor(() => getByText('message_one, message_two'));

//     expect(message).toBeInTheDocument();
//   });
// });
