/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, describe, it, vi } from 'vitest';

import { ErrorMessage } from './ErrorMessage.js';
import { createApp, renderInApp } from '@cloudbeaver/tests-runner';
import { coreDIManifest } from '@cloudbeaver/core-di';
import { coreBlocksManifest } from './manifest.js';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';

vi.mock('./s', () => ({
  s: (...args: any[]) => args.join(' '),
}));

vi.mock('./useS', () => ({
  useS: vi.fn(),
}));

vi.mock('./localization/useTranslate', () => ({
  useTranslate: () => (key: string) => key,
}));

vi.mock('./Button', () => ({
  Button: (props: any) => <button {...props} />,
}));

vi.mock('./IconOrImage', () => ({
  IconOrImage: (props: any) => <svg {...props} />,
}));

describe('ErrorMessage', async () => {
  const app = createApp(coreDIManifest, coreBlocksManifest, coreLocalizationManifest);

  it('should render error message', async () => {
    const { getByText } = renderInApp(<ErrorMessage text="error" />, app);
    await vi.waitFor(() => expect(getByText('error')).toBeInTheDocument());
  });
});
