/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';

import { DeleteUserDialog } from './DeleteUserDialog';
import { DisableUserDialog } from './DisableUserDialog';

export function useDeleteUser(userId: string, enabled: boolean) {
  const commonDialogService = useService(CommonDialogService);

  async function openDeleteUserDialog() {
    return await commonDialogService.open(DeleteUserDialog, {
      userId,
    });
  }

  async function deleteHandler() {
    if (enabled) {
      const result = await commonDialogService.open(DisableUserDialog, {
        userId,
      });

      if (result === DialogueStateResult.Rejected) {
        return;
      }

      await openDeleteUserDialog();
    } else {
      await openDeleteUserDialog();
    }
  }

  return deleteHandler;
}
