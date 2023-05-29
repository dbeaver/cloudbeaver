/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ErrorMessage, Loader, SubmittingForm, useAdministrationSettings, useFocus, useStyles } from '@cloudbeaver/core-blocks';
import { IConnectionInfoParams, useConnectionInfo, useDBDriver } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, DialogComponent } from '@cloudbeaver/core-dialogs';

import { ConnectionAuthenticationFormLoader } from '../ConnectionAuthentication/ConnectionAuthenticationFormLoader';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';

const styles = css`
  SubmittingForm {
    overflow: auto;
    margin: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  ConnectionAuthenticationFormLoader {
    align-content: center;
  }
  ErrorMessage {
    composes: theme-background-secondary theme-text-on-secondary from global;
    flex: 1;
  }
`;

interface Payload {
  connection: IConnectionInfoParams;
  networkHandlers: string[];
  resetCredentials?: boolean;
}

export const DatabaseAuthDialog: DialogComponent<Payload> = observer(function DatabaseAuthDialog({ payload, options, rejectDialog, resolveDialog }) {
  const connection = useConnectionInfo(payload.connection);
  const controller = useController(DBAuthDialogController, payload.connection, payload.networkHandlers, resolveDialog);

  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  let authModelId: string | null = null;

  if (connection.connectionInfo?.authNeeded || payload.resetCredentials) {
    authModelId = connection.connectionInfo?.authModel || driver?.defaultAuthModel || null;
  }

  return styled(useStyles(styles))(
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title="connections_database_authentication"
        subTitle={connection.connectionInfo?.name}
        icon={driver?.icon}
        onReject={options?.persistent ? undefined : rejectDialog}
      />
      <CommonDialogBody>
        <SubmittingForm ref={focusedRef} onSubmit={controller.login}>
          {!connection.isLoaded() || connection.isLoading() || !controller.configured ? (
            <Loader />
          ) : (
            <ConnectionAuthenticationFormLoader
              config={controller.config}
              authModelId={authModelId}
              authProperties={connection.connectionInfo?.authProperties}
              networkHandlers={payload.networkHandlers}
              formId={`${payload.connection.projectId}:${payload.connection.connectionId}`}
              allowSaveCredentials={credentialsSavingEnabled}
              disabled={controller.isAuthenticating}
              hideFeatures={['nonSecuredProperty']}
            />
          )}
        </SubmittingForm>
      </CommonDialogBody>
      <CommonDialogFooter>
        <DBAuthDialogFooter isAuthenticating={controller.isAuthenticating} onLogin={controller.login}>
          {controller.error.responseMessage && (
            <ErrorMessage text={controller.error.responseMessage} hasDetails={controller.error.hasDetails} onShowDetails={controller.showDetails} />
          )}
        </DBAuthDialogFooter>
      </CommonDialogFooter>
    </CommonDialogWrapper>,
  );
});
