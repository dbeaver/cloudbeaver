/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UsersResource } from '@cloudbeaver/core-authentication';
import { Button, type ButtonProps, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { DeleteUserDialog } from './DeleteUserDialog.js';
import { DisableUserDialog } from './DisableUserDialog.js';

interface Props extends ButtonProps {
  userId: string;
  enabled: boolean;
  disableUser: () => Promise<void>;
}

export const AdministrationUserFormDeleteButton: React.FC<Props> = function AdministrationUserFormDeleteButton({
  userId,
  enabled,
  disableUser,
  ...rest
}) {
  const translate = useTranslate();
  const commonDialogService = useService(CommonDialogService);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);
  const usersResource = useService(UsersResource);

  const userManagementDisabled = administrationUsersManagementService.externalUserProviderEnabled;
  const deleteDisabled = usersResource.isActiveUser(userId) || userManagementDisabled;

  if (deleteDisabled) {
    return null;
  }

  async function openUserDeleteDialog() {
    await commonDialogService.open(DeleteUserDialog, {
      userId,
    });
  }

  async function deleteUser() {
    if (enabled) {
      await commonDialogService.open(DisableUserDialog, {
        userId,
        onDelete: openUserDeleteDialog,
        disableUser: disableUser,
      });
    } else {
      await openUserDeleteDialog();
    }
  }

  return (
    <Button {...rest} variant="secondary" onClick={deleteUser}>
      {translate('ui_delete')}
    </Button>
  );
};
