/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, queryByAttribute, screen, waitFor } from '@testing-library/react';

import { coreDialogsManifest } from '@cloudbeaver/core-dialogs';
import { ENotificationType } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { StatusMessage } from './StatusMessage';

const app = createApp(coreLocalizationManifest, coreDialogsManifest);

describe('StatusMessage', () => {
  it('should display an error icon and message when type is error', async () => {
    const message = 'test_error';
    const { container } = renderInApp(<StatusMessage message={message} type={ENotificationType.Error} />, app);

    await waitFor(() => {
      expect(screen.getByTitle(message)).toBeTruthy();
      expect(queryByAttribute('src', container, /error/i)).toBeTruthy();
    });
  });

  it('should display a success icon and message when type is success', async () => {
    const message = 'test_success';
    const { container } = renderInApp(<StatusMessage message={message} type={ENotificationType.Success} />, app);

    await waitFor(() => {
      expect(screen.getByTitle(message)).toBeTruthy();
      expect(queryByAttribute('src', container, /success/i)).toBeTruthy();
    });
  });

  it('should display an error message when no message is provided', async () => {
    renderInApp(<StatusMessage exception={new Error('Test error')} />, app);

    await waitFor(() => {
      expect(screen.getByText('Test error')).toBeTruthy();
    });
  });

  it('should call onShowDetails when link is clicked', async () => {
    const onShowDetails = jest.fn();
    const message = 'test_message_with_details';
    renderInApp(<StatusMessage message={message} onShowDetails={onShowDetails} />, app);

    const link = await screen.findByText(message);
    fireEvent.click(link);
    expect(onShowDetails).toHaveBeenCalled();
  });

  it('should display multiple messages joined by comma', async () => {
    const messages = ['message_one', 'message_two'];
    renderInApp(<StatusMessage message={messages} />, app);

    await waitFor(() => {
      expect(screen.getByText('message_one, message_two')).toBeTruthy();
    });
  });
});
