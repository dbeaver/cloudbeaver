/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, test, vi } from 'vitest';

import { Icon } from './Icon.js';
import { createApp, renderInApp } from '@cloudbeaver/tests-runner';
import { coreDIManifest } from '@cloudbeaver/core-di';
import { coreBlocksManifest } from './manifest.js';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';

vi.mock('@cloudbeaver/core-utils', () => ({
  GlobalConstants: {
    absoluteUrl: (name: string) => name,
  },
}));

describe('Icon', () => {
  const app = createApp(coreDIManifest, coreBlocksManifest, coreLocalizationManifest);

  test('/image.jpg', async () => {
    const { getByTestId } = renderInApp(<Icon data-testid="Icon" name="/image.jpg" />, app);
    const icon = await vi.waitFor(() => getByTestId('Icon'));
    expect(icon.querySelector('use')).toHaveAttribute('href', '/image.jpg');
  });
});
