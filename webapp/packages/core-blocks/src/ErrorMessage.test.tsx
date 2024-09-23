/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { expect, test } from '@jest/globals';
import { screen, waitFor } from '@testing-library/react';

import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { ErrorMessage } from './ErrorMessage.js';

const app = createApp(coreEventsManifest, coreSettingsManifest, coreThemingManifest, coreLocalizationManifest);

test('icons.svg#name', async () => {
  renderInApp(<ErrorMessage text="error" />, app);
  await waitFor(() => expect(screen.getByText('error')).not.toBeNull());
});
