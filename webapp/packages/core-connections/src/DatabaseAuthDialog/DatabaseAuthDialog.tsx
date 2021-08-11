/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
import {
  SubmittingForm,
  Loader,
  useFocus,
  ErrorMessage,
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { ConnectionCredentialsForm } from '../ConnectionCredentials/ConnectionCredentialsForm';
import { useConnectionInfo } from '../useConnectionInfo';
import { useDBDriver } from '../useDBDriver';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
  `,
  css`
    CommonDialogWrapper {
      min-height: 400px;
      min-width: 500px;
    }
    SubmittingForm {
      overflow: auto;
      margin: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    ConnectionCredentialsForm {
      align-content: center;
    }
    ErrorMessage {
      flex: 1;
    }
`);

interface Payload {
  connectionId: string;
  networkHandlers: string[];
}

export const DatabaseAuthDialog = observer(function DatabaseAuthDialog({
  payload,
  options,
  rejectDialog,
}: DialogComponentProps<Payload>) {
  const translate = useTranslate();
  const connection = useConnectionInfo(payload.connectionId);
  const controller = useController(DBAuthDialogController, payload.connectionId, rejectDialog);

  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  let authModelId: string | null = null;

  if (connection.connectionInfo?.authNeeded) {
    authModelId = connection.connectionInfo?.authModel || driver?.defaultAuthModel || null;
  }

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={translate('connections_database_authentication')}
      subTitle={connection.connectionInfo?.name}
      icon={driver?.icon}
      footer={(
        <DBAuthDialogFooter
          isAuthenticating={controller.isAuthenticating}
          onLogin={controller.login}
        >
          {controller.error?.responseMessage && (
            <ErrorMessage
              text={controller.error.responseMessage}
              hasDetails={controller.error.hasDetails}
              onShowDetails={controller.showDetails}
            />
          )}
        </DBAuthDialogFooter>
      )}
      onReject={options?.persistent ? undefined : rejectDialog}
    >
      {(!connection.isLoaded() || connection.isLoading())
        ? <Loader />
        : (
          <SubmittingForm ref={focusedRef} onSubmit={controller.login}>
            <ConnectionCredentialsForm
              config={controller.config}
              authModelId={authModelId}
              networkHandlers={payload.networkHandlers}
              formId={payload.connectionId}
              allowSaveCredentials={credentialsSavingEnabled}
              disabled={controller.isAuthenticating}
            />
          </SubmittingForm>
        )}
    </CommonDialogWrapper>
  );
});
