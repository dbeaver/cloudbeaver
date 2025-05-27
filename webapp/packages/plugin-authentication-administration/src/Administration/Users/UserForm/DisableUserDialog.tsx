/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  s,
  Text,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';

import classes from './DisableUserDialog.module.css';

interface IPayload {
  userId: string;
  onDelete: () => void;
  disableUser: () => Promise<void>;
}

export const DisableUserDialog: DialogComponent<IPayload> = observer(function DisableUserDialog(props) {
  const translate = useTranslate();
  const styles = useS(classes);
  const notificationService = useService(NotificationService);

  async function disableHandler() {
    try {
      await props.payload.disableUser();
      notificationService.logSuccess({ title: 'authentication_administration_users_disable_user_success', message: props.payload.userId });
      props.resolveDialog();
    } catch (exception: any) {
      notificationService.logException(exception, 'authentication_administration_users_disable_user_fail');
    }
  }

  function deleteHandler() {
    props.payload.onDelete();
    props.rejectDialog();
  }

  return (
    <CommonDialogWrapper size="small" className={s(styles, { commonDialogWrapper: true })} fixedWidth>
      <CommonDialogHeader
        title={translate('authentication_administration_users_delete_user')}
        icon="/icons/error_icon.svg"
        bigIcon
        onReject={props.rejectDialog}
      />
      <CommonDialogBody>
        <Text>{translate('authentication_administration_users_delete_user_disable_info', undefined, { username: props.payload.userId })}</Text>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button variant="secondary" onClick={props.rejectDialog}>
          {translate('ui_processing_cancel')}
        </Button>
        <Fill />
        <Container noWrap gap dense keepSize>
          <Button variant="secondary" onClick={deleteHandler}>
            {translate('ui_delete')}
          </Button>
          <Button onClick={disableHandler}>{translate('ui_disable')}</Button>
        </Container>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
