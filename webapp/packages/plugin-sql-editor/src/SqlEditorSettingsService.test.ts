/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom';

import { mockAuthentication } from '@cloudbeaver/core-authentication/mocks/mockAuthentication';
import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { createGQLEndpoint } from '@cloudbeaver/core-root/mocks/createGQLEndpoint';
import { mockAppInit } from '@cloudbeaver/core-root/mocks/mockAppInit';
import { mockGraphQL } from '@cloudbeaver/core-root/mocks/mockGraphQL';
import { mockServerConfig } from '@cloudbeaver/core-root/mocks/resolvers/mockServerConfig';
import dataViewer from '@cloudbeaver/plugin-data-viewer';
import datasourceContextSwitch from '@cloudbeaver/plugin-datasource-context-switch';
import navigationTabs from '@cloudbeaver/plugin-navigation-tabs';
import navigationTree from '@cloudbeaver/plugin-navigation-tree';
import objectViewer from '@cloudbeaver/plugin-object-viewer';

import { sqlEditorPluginManifest } from './manifest';
import { SqlEditorSettings, SqlEditorSettingsService } from './SqlEditorSettingsService';

const endpoint = createGQLEndpoint();
const app = createApp(datasourceContextSwitch, navigationTabs, navigationTree, objectViewer, dataViewer, sqlEditorPluginManifest);

const server = mockGraphQL(...mockAppInit(endpoint), ...mockAuthentication(endpoint));

beforeAll(() => app.init());

const testValue = 1;

const equalConfig = {
  core: {
    app: {
      sqlEditor: {
        maxFileSize: testValue,
      } as SqlEditorSettings,
    },
  },
  plugin: {
    'sql-editor': {
      maxFileSize: testValue,
    } as SqlEditorSettings,
  },
};

test('New settings equal deprecated settings', async () => {
  const settings = app.injector.getServiceByClass(SqlEditorSettingsService);
  const config = app.injector.getServiceByClass(ServerConfigResource);

  server.use(endpoint.query('serverConfig', mockServerConfig(equalConfig)));

  await config.refresh();

  expect(settings.settings.getValue('maxFileSize')).toBe(testValue);
  expect(settings.deprecatedSettings.getValue('maxFileSize')).toBe(testValue);
});
