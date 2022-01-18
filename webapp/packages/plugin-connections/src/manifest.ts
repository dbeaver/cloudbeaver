/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PluginManifest } from '@cloudbeaver/core-di';

import { ConnectionAuthService } from './ConnectionAuthService';
import { ConnectionFormService } from './ConnectionForm/ConnectionFormService';
import { ConnectionDriverPropertiesTabService } from './ConnectionForm/DriverProperties/ConnectionDriverPropertiesTabService';
import { ConnectionOptionsTabService } from './ConnectionForm/Options/ConnectionOptionsTabService';
import { ConnectionOriginInfoTabService } from './ConnectionForm/OriginInfo/ConnectionOriginInfoTabService';
import { ConnectionSSHTabService } from './ConnectionForm/SSH/ConnectionSSHTabService';
import { ConnectionMenuBootstrap } from './ContextMenu/ConnectionMenuBootstrap';
import { LocaleService } from './LocaleService';
import { PublicConnectionFormService } from './PublicConnectionForm/PublicConnectionFormService';

export const connectionPlugin: PluginManifest = {
  info: {
    name: 'Connections plugin',
  },

  providers: [
    ConnectionMenuBootstrap,
    PublicConnectionFormService,
    LocaleService,
    ConnectionAuthService,
    ConnectionFormService,
    ConnectionOptionsTabService,
    ConnectionDriverPropertiesTabService,
    ConnectionSSHTabService,
    ConnectionOriginInfoTabService,
  ],
};
