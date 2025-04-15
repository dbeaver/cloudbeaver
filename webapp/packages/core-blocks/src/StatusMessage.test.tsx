/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';

import { ENotificationType } from '@cloudbeaver/core-events';

import { StatusMessage } from './StatusMessage.js';
import { renderInApp } from '@cloudbeaver/tests-runner';
import * as ErrorDetailsModule from './useErrorDetails.js';

vi.mock('./localization/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock('./s', () => ({
  s: vi.fn(),
}));

vi.mock('./IconOrImage', () => ({
  IconOrImage: (props: any) => <svg {...props} />,
}));

vi.mock('./Link', () => ({
  Link: (props: any) => <a {...props} />,
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

vi.mock('./useErrorDetails', () => ({
  useErrorDetails: (exception: Error | null) => ({
    message: exception?.message || '',
    hasDetails: false,
  }),
}));

describe('StatusMessage', () => {
  it('should display an error icon and message when type is error', async () => {
    const message = 'test_error';
    const { container, getByTitle } = renderInApp(<StatusMessage message={message} type={ENotificationType.Error} />);
    const title = await vi.waitFor(() => getByTitle(message));
    const icon = container.querySelector('svg');

    expect(title).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('should display a success icon and message when type is success', async () => {
    const message = 'test_success';
    const { container, getByTitle } = renderInApp(<StatusMessage message={message} type={ENotificationType.Success} />);
    const title = await vi.waitFor(() => getByTitle(message));
    const icon = container.querySelector('svg');

    expect(title).toBeInTheDocument();
    expect(icon).toBeInTheDocument();
  });

  it('should display an error message when no message is provided', async () => {
    const message = 'test_error';
    const error = new Error(message);
    vi.spyOn(ErrorDetailsModule, 'useErrorDetails').mockReturnValueOnce({
      hasDetails: true,
      error,
      message: error.message,
      isOpen: true,
      open: vi.fn(),
    });

    const { getByText } = renderInApp(<StatusMessage exception={error} />);
    const statusMessage = await vi.waitFor(() => getByText(message));

    expect(statusMessage).toBeInTheDocument();
  });

  it('should call onShowDetails when link is clicked', async () => {
    const onShowDetails = vi.fn();
    const message = 'test_message_with_details';
    const { getByText } = renderInApp(<StatusMessage message={message} onShowDetails={onShowDetails} />);
    const link = await vi.waitFor(() => getByText(message));

    fireEvent.click(link);
    expect(onShowDetails).toHaveBeenCalled();
  });

  it('should display multiple messages joined by comma', async () => {
    const messages = ['message_one', 'message_two'];
    const { getByText } = renderInApp(<StatusMessage message={messages} />);
    const message = await vi.waitFor(() => getByText('message_one, message_two'));

    expect(message).toBeInTheDocument();
  });
});
