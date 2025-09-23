/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { bootstrap } from '@cloudbeaver/core-bootstrap';

import pluginDataEditorPublicSettings from '@cloudbeaver/plugin-data-editor-public-settings/module';
import productDefault from './module.js';
import { commonSet } from '@cloudbeaver/plugin-set-common';

const PLUGINS = [
  ...commonSet,
  pluginDataEditorPublicSettings,
  // must be las one to override all
  productDefault,
];

bootstrap(PLUGINS);
