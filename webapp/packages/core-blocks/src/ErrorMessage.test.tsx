/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, describe, it, vi } from 'vitest';

import { ErrorMessage } from './ErrorMessage.js';
import { renderInApp } from '@cloudbeaver/tests-runner';

vi.mock('./localization/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock('./Button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('./IconOrImage', () => ({
  IconOrImage: (props: any) => <svg {...props} />,
}));

describe('ErrorMessage', () => {
  it('should render error message', async () => {
    const { getByText } = renderInApp(<ErrorMessage text="error" />);
    await vi.waitFor(() => expect(getByText('error')).toBeInTheDocument());
  });

  it('should have role="status"', async () => {
    const { getByRole } = renderInApp(<ErrorMessage text="error" />);
    await vi.waitFor(() => expect(getByRole('status')).toBeInTheDocument());
  });
});
