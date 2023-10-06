/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { PluginManifest } from '@cloudbeaver/core-di';

import { PluginBootstrap } from './PluginBootstrap';
import { SessionExpiredDialogBootstrap } from './SessionExpireDialog/SessionExpiredDialogBootstrap';
import { SessionExpireWarningDialogBootstrap } from './SessionExpireWarningDialog/SessionExpireWarningDialogBootstrap';

export const sessionExpirationPlugin: PluginManifest = {
  info: { name: 'Session Expiration plugin' },
  providers: [PluginBootstrap, SessionExpiredDialogBootstrap, SessionExpireWarningDialogBootstrap],
};
