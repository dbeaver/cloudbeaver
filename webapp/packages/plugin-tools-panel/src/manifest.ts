/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { LocaleService } from './LocaleService';
import { PluginBootstrap } from './PluginBootstrap';
import { ToolsPanelService } from './ToolsPanel/ToolsPanelService';
import { ToolsPanelSettingsService } from './ToolsPanelSettingsService';

export const toolsPanelPlugin: PluginManifest = {
  info: { name: 'Tools panel plugin' },
  providers: [ToolsPanelService, PluginBootstrap, LocaleService, ToolsPanelSettingsService],
};
