/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, Dependency, ModuleRegistry, proxy } from '@cloudbeaver/core-di';
import { PluginConnectionsSettingsService } from './PluginConnectionsSettingsService.js';
import { PublicConnectionFormService } from './PublicConnectionForm/PublicConnectionFormService.js';
import { ConnectionsExplorerBootstrap } from './NavNodes/ConnectionsExplorerBootstrap.js';
import { PluginBootstrap } from './PluginBootstrap.js';
import { ConnectionNavNodeService } from './NavNodes/ConnectionNavNodeService.js';
import { ConnectionFoldersBootstrap } from './NavNodes/ConnectionFoldersBootstrap.js';
import { LocaleService } from './LocaleService.js';
import { ConnectionMenuBootstrap } from './ContextMenu/ConnectionMenuBootstrap.js';
import { ConnectionSSLTabService } from './ConnectionForm/SSL/ConnectionSSLTabService.js';
import { ConnectionOriginInfoTabService } from './ConnectionForm/OriginInfo/ConnectionOriginInfoTabService.js';
import { ConnectionSSHTabService } from './ConnectionForm/SSH/ConnectionSSHTabService.js';
import { ConnectionOptionsTabService } from './ConnectionForm/Options/ConnectionOptionsTabService.js';
import { ConnectionDriverPropertiesTabService } from './ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService.js';
import { ConnectionFormService } from './ConnectionForm/ConnectionFormService.js';
import { ConnectionAuthService } from './ConnectionAuthService.js';

export default ModuleRegistry.add({
  name: '@cloudbeaver/plugin-connections',

  configure: serviceCollection => {
    serviceCollection
      .addSingleton(Bootstrap, proxy(ConnectionDriverPropertiesTabService))
      .addSingleton(Bootstrap, proxy(ConnectionFoldersBootstrap))
      .addSingleton(Bootstrap, proxy(ConnectionMenuBootstrap))
      .addSingleton(Bootstrap, proxy(ConnectionOptionsTabService))
      .addSingleton(Bootstrap, proxy(ConnectionOriginInfoTabService))
      .addSingleton(Bootstrap, proxy(ConnectionsExplorerBootstrap))
      .addSingleton(Bootstrap, proxy(ConnectionSSHTabService))
      .addSingleton(Bootstrap, proxy(ConnectionSSLTabService))
      .addSingleton(Bootstrap, LocaleService)
      .addSingleton(Bootstrap, PluginBootstrap)
      .addSingleton(Dependency, proxy(ConnectionAuthService))
      .addSingleton(Dependency, proxy(PluginConnectionsSettingsService))
      .addSingleton(Dependency, proxy(ConnectionNavNodeService))
      .addSingleton(ConnectionAuthService)
      .addSingleton(PluginConnectionsSettingsService)
      .addSingleton(PublicConnectionFormService)
      .addSingleton(ConnectionsExplorerBootstrap)
      .addSingleton(ConnectionNavNodeService)
      .addSingleton(ConnectionFoldersBootstrap)
      .addSingleton(ConnectionMenuBootstrap)
      .addSingleton(ConnectionSSLTabService)
      .addSingleton(ConnectionOriginInfoTabService)
      .addSingleton(ConnectionSSHTabService)
      .addSingleton(ConnectionOptionsTabService)
      .addSingleton(ConnectionDriverPropertiesTabService)
      .addSingleton(ConnectionFormService);
  },
});
