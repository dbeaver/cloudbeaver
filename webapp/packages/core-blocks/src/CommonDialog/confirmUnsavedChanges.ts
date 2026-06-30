/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { ConfirmationDialog } from './ConfirmationDialog.js';

export interface IUnsavedChangesProvider {
  readonly isChanged: boolean;
  readonly isSaving?: boolean;
  /** Returns whether the save succeeded. `undefined` means there was nothing to save and navigation may proceed. */
  save(): Promise<boolean> | undefined;
  reset(): void;
  title?: string;
  subTitle?: string;
  message?: TLocalizationToken;
}

/**
 * Shows a unified "Save / Don't save / Cancel" dialog when the provider has unsaved changes.
 *
 * @returns `true` when navigation may proceed (saved successfully or discarded), `false` to block it.
 */
export async function confirmUnsavedChanges(commonDialogService: CommonDialogService, provider: IUnsavedChangesProvider): Promise<boolean> {
  if (!provider.isChanged) {
    return true;
  }

  if (provider.isSaving) {
    return false;
  }

  const { status, result } = await commonDialogService.open(ConfirmationDialog, {
    title: provider.title ?? 'ui_save_reminder',
    subTitle: provider.subTitle,
    message: provider.message ?? 'ui_changes_might_be_lost',
    confirmActionText: 'ui_processing_save',
    extraActionText: 'ui_processing_dont_save',
    cancelActionText: 'ui_processing_cancel',
    showExtraAction: true,
  });

  if (status === DialogueStateResult.Resolved) {
    return (await provider.save()) ?? true;
  }

  if (result?.isExtraAction) {
    provider.reset();
    return true;
  }

  return false;
}
