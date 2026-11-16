/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ModuleRegistry } from '@cloudbeaver/core-di';
import { ConnectionAuthService } from './ConnectionAuthService.js';
import { AdvancedSettingsTabService } from './ConnectionForm/AdvancedSettings/AdvancedSettingsTabService.js';
import { ConnectionDetailsTabService } from './ConnectionForm/ConnectionDetails/ConnectionDetailsTabService.js';
import { ConnectionFormService } from './ConnectionForm/ConnectionFormService.js';
import { ConnectionDriverPropertiesTabService } from './ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService.js';
import { InitializationSettingsTabService } from './ConnectionForm/InitializationSettings/InitializationSettingsTabService.js';
import { ConnectionOptionsTabService } from './ConnectionForm/Options/ConnectionOptionsTabService.js';
import { ConnectionOriginInfoTabService } from './ConnectionForm/OriginInfo/ConnectionOriginInfoTabService.js';
import { ConnectionMenuBootstrap } from './ContextMenu/ConnectionMenuBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionFoldersBootstrap } from './NavNodes/ConnectionFoldersBootstrap.js';
import { ConnectionNavNodeService } from './NavNodes/ConnectionNavNodeService.js';
import { ConnectionsExplorerBootstrap } from './NavNodes/ConnectionsExplorerBootstrap.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { PluginConnectionsSettingsService } from './PluginConnectionsSettingsService.js';
import { PublicConnectionFormService } from './PublicConnectionForm/PublicConnectionFormService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connections',

  services: () => [
    ConnectionAuthService,
    PluginConnectionsSettingsService,
    PublicConnectionFormService,
    ConnectionsExplorerBootstrap,
    ConnectionNavNodeService,
    ConnectionFoldersBootstrap,
    ConnectionMenuBootstrap,
    ConnectionOriginInfoTabService,
    ConnectionOptionsTabService,
    ConnectionDetailsTabService,
    AdvancedSettingsTabService,
    InitializationSettingsTabService,
    ConnectionDriverPropertiesTabService,
    ConnectionFormService,
  ],
  bootstraps: () => [
    ConnectionDriverPropertiesTabService,
    ConnectionFoldersBootstrap,
    ConnectionMenuBootstrap,
    ConnectionOptionsTabService,
    ConnectionDetailsTabService,
    AdvancedSettingsTabService,
    InitializationSettingsTabService,
    ConnectionOriginInfoTabService,
    ConnectionsExplorerBootstrap,
    LocaleService,
    PluginBootstrap,
  ],
});
