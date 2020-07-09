/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { SubmittingForm, ErrorMessage, Loader } from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { useConnectionInfo } from '../useConnectionInfo';
import { AuthForm } from './AuthForm';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
    connection-name {
      padding: 8px 16px;
    }
    CommonDialogWrapper {
      min-height: 400px;
      min-width: 600px;
    }
    SubmittingForm {
      overflow: auto;
      margin: auto;
      margin-top: 20px;
      margin-bottom: 20px;
    }
    SubmittingForm, AuthForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    AuthForm {
      flex-direction: column;
      padding: 18px 24px;
    }
    ErrorMessage {
      position: sticky;
      bottom: 0;
      padding: 8px 24px;
    }
  `
);

export const DatabaseAuthDialog = observer(function DatabaseAuthDialog({
  payload,
  options,
  rejectDialog,
}: DialogComponentProps<string, null>) {
  const connection = useConnectionInfo(payload);
  const controller = useController(DBAuthDialogController, payload, rejectDialog);
  const translate = useTranslate();

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={translate('authentication_login_dialog_title')}
      noBodyPadding
      header={(
        <connection-name as="div">
          {connection.connectionInfo?.name}
        </connection-name>
      )}
      footer={(
        <DBAuthDialogFooter
          isAuthenticating={controller.isAuthenticating}
          onLogin={controller.login}
        />
      )}
      onReject={options?.persistent ? undefined : rejectDialog}
    >
      {(!connection.isLoaded() || connection.isLoading())
        ? <Loader />
        : (
          <SubmittingForm onSubmit={controller.login}>
            <AuthForm
              authProperties={connection.connectionInfo?.authProperties!}
              credentials={controller.credentials}
              authenticate={controller.isAuthenticating}
            />
          </SubmittingForm>
        )}
      {controller.error.responseMessage && (
        <ErrorMessage
          text={controller.error.responseMessage}
          hasDetails={controller.error.hasDetails}
          onShowDetails={controller.showDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
