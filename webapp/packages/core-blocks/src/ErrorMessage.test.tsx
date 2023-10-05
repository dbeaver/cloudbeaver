/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';
import { screen } from '@testing-library/react';

import { coreBrowserManifest } from '@cloudbeaver/core-browser';
import { coreEventsManifest } from '@cloudbeaver/core-events';
import { coreLocalizationManifest } from '@cloudbeaver/core-localization';
import { corePluginManifest } from '@cloudbeaver/core-plugin';
import { coreProductManifest } from '@cloudbeaver/core-product';
import { coreRootManifest } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/dist/__custom_mocks__/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/dist/__custom_mocks__/mockGraphQL';
import { coreSDKManifest } from '@cloudbeaver/core-sdk';
import { coreSettingsManifest } from '@cloudbeaver/core-settings';
import { coreThemingManifest } from '@cloudbeaver/core-theming';
import { createApp, renderInApp } from '@cloudbeaver/tests-runner';

import { ErrorMessage } from './ErrorMessage';

const endpoint = createGQLEndpoint();
const app = createApp(
  coreEventsManifest,
  corePluginManifest,
  coreProductManifest,
  coreRootManifest,
  coreSDKManifest,
  coreSettingsManifest,
  coreBrowserManifest,
  coreThemingManifest,
  coreLocalizationManifest,
);

mockGraphQL(...mockAppInit(endpoint));

beforeAll(() => app.init());

test('icons.svg#name', () => {
  renderInApp(<ErrorMessage text="error" />, app);
  expect(screen.getByText('error')).not.toBeNull();
});
