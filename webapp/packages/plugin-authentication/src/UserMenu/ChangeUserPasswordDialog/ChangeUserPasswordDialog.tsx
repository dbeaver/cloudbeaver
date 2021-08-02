/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useState, useCallback, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Container, ErrorMessage, Group, InputFieldNew, SubmittingForm, useErrorDetails, useFocus } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponent, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-localization';
import { GQLErrorCatcher } from '@cloudbeaver/core-sdk';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { ChangeUserPasswordDialogFooter } from './ChangeUserPasswordDialogFooter';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
`,
  css`
    CommonDialogWrapper {
      min-width: 500px;
    }
    ErrorMessage {
      flex: 1;
    }
`);

interface IState {
  oldPassword: string;
  newPassword: string;
  repeatedPassword: string;
  error: GQLErrorCatcher;
  customError: string;
  submitting: boolean;
}

export const ChangeUserPasswordDialog: DialogComponent<null, null> = observer(
  function ChangeUserPasswordDialog({
    payload,
    resolveDialog,
    rejectDialog,
  }: DialogComponentProps<null, null>) {
    const [focusedRef] = useFocus<HTMLInputElement>({});
    const usersResource = useService(UsersResource);
    const notificationService = useService(NotificationService);
    const style = useStyles(styles, BASE_CONTAINERS_STYLES);
    const translate = useTranslate();
    const [state] = useState<IState>(() => observable({
      oldPassword: '', newPassword: '', repeatedPassword: '', error: new GQLErrorCatcher(), customError: '', submitting: false,
    }));
    const { details: errorDetails, open: openErrorDetails } = useErrorDetails(state.error.exception);
    const formFilled
    = state.newPassword.length > 0 && state.repeatedPassword.length > 0 && state.oldPassword.length > 0;
    const disabled = state.submitting;

    const change = useCallback(async () => {
      state.error.clear();

      if (state.newPassword !== state.repeatedPassword) {
        state.customError = 'authentication_user_passwords_not_match';
        return;
      }

      try {
        state.submitting = true;
        await usersResource.updateLocalPassword(state.oldPassword, state.newPassword);
        notificationService.logSuccess({ title: 'authentication_user_password_change_success' });
        resolveDialog();
      } catch (exeption) {
        if (!state.error.catch(exeption)) {
          state.customError = exeption.message;
        }
      } finally {
        state.submitting = false;
      }
    }, [state, resolveDialog, notificationService, usersResource]);

    useEffect(() => {
      focusedRef.current?.focus();
    }, []);

    return styled(style)(
      <CommonDialogWrapper
        title={translate('authentication_user_password_change_dialog_title')}
        footer={(
          <ChangeUserPasswordDialogFooter
            submitting={state.submitting}
            formFilled={formFilled}
            onCancel={rejectDialog}
            onChange={change}
          >
            {(errorDetails?.message || state.customError) && (
              <ErrorMessage
                text={errorDetails?.message || translate(state.customError)}
                hasDetails={errorDetails?.hasDetails}
                onShowDetails={openErrorDetails}
              />
            )}
          </ChangeUserPasswordDialogFooter>
        )}
        onReject={rejectDialog}
      >
        <SubmittingForm onSubmit={change}>
          <Container>
            <Group small gap center>
              <InputFieldNew
                ref={focusedRef}
                type='password'
                name='oldPassword'
                state={state}
                disabled={disabled}
                mapValue={(value => value.trim())}
                small
                required
              >
                {translate('authentication_user_current_password')}
              </InputFieldNew>
              <InputFieldNew
                type='password'
                name='newPassword'
                autoComplete='new-password'
                state={state}
                disabled={disabled}
                mapValue={(value => value.trim())}
                small
                required
              >
                {translate('authentication_user_new_password')}
              </InputFieldNew>
              <InputFieldNew
                type='password'
                name='repeatedPassword'
                state={state}
                disabled={disabled}
                mapValue={(value => value.trim())}
                small
                required
              >
                {translate('authentication_user_password_repeat')}
              </InputFieldNew>
            </Group>
          </Container>
        </SubmittingForm>
      </CommonDialogWrapper>
    );
  }
);
