/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  InputField,
  Text,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import { UsersTableOptionsPanelService } from '../UsersTable/UsersTableOptionsPanelService.js';

interface IPayload {
  userId: string;
}

export const DeleteUserDialog: DialogComponent<IPayload> = function DeleteUserDialog(props) {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);
  const usersResource = useService(UsersResource);

  const [name, setName] = useState('');

  async function deleteUser() {
    try {
      await usersTableOptionsPanelService.close();
      await usersResource.deleteUsers(props.payload.userId);
      notificationService.logSuccess({ title: 'authentication_administration_users_delete_user_success', message: props.payload.userId });
      props.resolveDialog();
    } catch (exception: any) {
      notificationService.logException(exception, 'authentication_administration_users_delete_user_fail');
    }
  }

  return (
    <CommonDialogWrapper size="small" fixedWidth>
      <CommonDialogHeader
        title={translate('authentication_administration_users_delete_user')}
        icon="/icons/error_icon.svg"
        bigIcon
        onReject={props.rejectDialog}
      />
      <CommonDialogBody>
        <Container gap>
          <Text>{translate('authentication_administration_users_delete_user_info', undefined, { username: props.payload.userId })}</Text>
          <InputField
            description={translate('authentication_administration_users_delete_user_confirmation_input_description')}
            placeholder={translate('authentication_administration_users_delete_user_confirmation_input_placeholder')}
            value={name}
            onChange={v => setName(String(v))}
          />
        </Container>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button mod={['outlined']} onClick={props.rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Button mod={['unelevated']} disabled={name !== props.payload.userId} onClick={deleteUser}>
          {translate('ui_delete')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
