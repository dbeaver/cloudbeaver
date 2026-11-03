/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import type { CommonDialogService, DialogResult } from '@cloudbeaver/core-dialogs';

import type { GeneratedSqlPayload } from './generatedSqlPayload.js';

const GeneratedSqlDialog = importLazyComponent(() => import('./GeneratedSqlDialog.js').then(m => m.GeneratedSqlDialog));

export function openGeneratedSqlDialog(dialogService: CommonDialogService, payload: GeneratedSqlPayload): Promise<DialogResult> {
  const dialog = dialogService.open(GeneratedSqlDialog, { ...payload, onClose: () => dialogService.rejectDialog(dialog) }, { persistent: true });

  return dialog;
}
