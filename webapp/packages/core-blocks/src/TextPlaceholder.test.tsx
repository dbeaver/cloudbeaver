/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { TextPlaceholder } from './TextPlaceholder.js';
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

describe('TextPlaceholder Component', () => {
  const app = createApp(coreDIManifest, coreBlocksManifest, coreLocalizationManifest);

  it('renders children correctly', async () => {
    const { getByText } = renderInApp(<TextPlaceholder>Hello World</TextPlaceholder>, app);
    const text = await vi.waitFor(() => getByText('Hello World'));
    expect(text).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderInApp(<TextPlaceholder className="custom-class">Hello World</TextPlaceholder>, app);
    expect(container.getElementsByClassName('custom-class')).toHaveLength(1);
  });
});
