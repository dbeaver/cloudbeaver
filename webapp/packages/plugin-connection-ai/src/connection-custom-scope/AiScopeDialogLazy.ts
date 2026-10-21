/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import type { IAiScopeDialogPayload } from './IAiScopeDialogPayload.js';

export const AiScopeDialog: DialogComponent<IAiScopeDialogPayload, string[]> = importLazyComponent(() =>
  import('./AiScopeDialog.js').then(m => m.AiScopeDialog),
);
