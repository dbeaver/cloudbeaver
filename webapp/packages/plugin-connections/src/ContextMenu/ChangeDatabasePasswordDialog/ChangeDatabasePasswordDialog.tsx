/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Container,
  Fill,
  Form,
  InputField,
  useForm,
  useFormCustomInputValidation,
  useObservableRef,
  usePasswordValidation,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { isValuesEqual } from '@cloudbeaver/core-utils';

export interface ChangeDatabasePasswordDialogPayload {
  projectId: string;
  connectionId: string;
}

interface State {
  currentPassword: string;
  newPassword: string;
  repeatPassword: string;
  submitting: boolean;
}

export const ChangeDatabasePasswordDialog: DialogComponent<ChangeDatabasePasswordDialogPayload, null> = observer(
  function ChangeDatabasePasswordDialog({ payload, resolveDialog, rejectDialog }) {
    const translate = useTranslate();
    const graphQLService = useService(GraphQLService);
    const notificationService = useService(NotificationService);

    const state = useObservableRef<State>(
      (): State => ({ currentPassword: '', newPassword: '', repeatPassword: '', submitting: false }),
      {
        currentPassword: observable.ref,
        newPassword: observable.ref,
        repeatPassword: observable.ref,
        submitting: observable.ref,
      },
      false,
    );

    const form = useForm({
      async onSubmit() {
        if (state.submitting) {
          return;
        }
        state.submitting = true;
        try {
          await graphQLService.sdk.changeConnectionUserPassword({
            projectId: payload.projectId,
            connectionId: payload.connectionId,
            oldPassword: state.currentPassword,
            newPassword: state.newPassword,
          });
          notificationService.logSuccess({
            title: 'plugin_connections_change_db_password_success',
          });
          resolveDialog(null);
        } catch (exception) {
          notificationService.logException(exception as Error, 'plugin_connections_change_db_password_failed');
        } finally {
          state.submitting = false;
        }
      },
    });

    const passwordValidation = usePasswordValidation(form);
    const repeatValidation = useFormCustomInputValidation<string>(
      value => (isValuesEqual(value, state.newPassword, '') ? null : 'plugin_connections_change_db_password_mismatch'),
      form,
    );

    return (
      <CommonDialogWrapper size="small" fixedWidth>
        <CommonDialogHeader title="plugin_connections_change_db_password_dialog_title" onReject={rejectDialog} />
        <CommonDialogBody>
          <Form context={form}>
            <Container center>
              <InputField type="password" name="currentPassword" state={state} required>
                {translate('plugin_connections_change_db_password_current')}
              </InputField>
              <InputField type="password" name="newPassword" state={state} ref={passwordValidation} onChange={repeatValidation.revalidate} required>
                {translate('plugin_connections_change_db_password_new')}
              </InputField>
              <InputField type="password" name="repeatPassword" state={state} ref={repeatValidation.ref} required>
                {translate('plugin_connections_change_db_password_repeat')}
              </InputField>
            </Container>
          </Form>
        </CommonDialogBody>
        <CommonDialogFooter>
          <Button variant="secondary" onClick={() => rejectDialog()}>
            {translate('ui_processing_cancel')}
          </Button>
          <Fill />
          <Button
            disabled={state.submitting || !state.currentPassword || !state.newPassword || !state.repeatPassword}
            onClick={() => form.submit()}
          >
            {translate('plugin_connections_change_db_password_submit')}
          </Button>
        </CommonDialogFooter>
      </CommonDialogWrapper>
    );
  },
);
