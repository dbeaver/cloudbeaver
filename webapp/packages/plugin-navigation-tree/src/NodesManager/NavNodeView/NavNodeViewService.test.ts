/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import '@testing-library/jest-dom';

import { createApp } from '@cloudbeaver/core-cli/tests/utils/createApp';
import { getService } from '@cloudbeaver/core-cli/tests/utils/getService';
import datasourceContextSwitchPlugin from '@cloudbeaver/plugin-datasource-context-switch';
import navigationTabsPlugin from '@cloudbeaver/plugin-navigation-tabs';
import topAppBarPlugin from '@cloudbeaver/plugin-top-app-bar';

import { navigationTreePlugin } from '../../manifest';
import { NavNodeViewService } from './NavNodeViewService';

const app = createApp(
  topAppBarPlugin,
  navigationTabsPlugin,
  datasourceContextSwitchPlugin,
  navigationTreePlugin
);

beforeAll(() => app.init());

describe('filterDuplicates', () => {
  test('Filter duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['0', '1', '2', '3', '0', '3']);

    expect(nodes).toEqual(['1', '2']);
    expect(duplicates).toEqual(['0', '3']);
  });

  test('No duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);
    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['1', '2', '0']);

    expect(nodes).toEqual(['1', '2', '0']);
    expect(duplicates).toEqual([]);
  });

  test('Empty list', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates([]);

    expect(nodes).toEqual([]);
    expect(duplicates).toEqual([]);
  });

  test('Only duplicates', async () => {
    const navNodeViewService = getService(app, NavNodeViewService);

    const { nodes, duplicates } = navNodeViewService.filterDuplicates(['0', '1', '0', '1', '2', '3', '2', '3']);

    expect(nodes).toEqual([]);
    expect(duplicates).toEqual(['0', '1', '2', '3']);
  });
});