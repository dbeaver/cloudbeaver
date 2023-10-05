/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  ErrorMessage,
  Form,
  Loader,
  s,
  useAdministrationSettings,
  useFocus,
  useS,
} from '@cloudbeaver/core-blocks';
import { IConnectionInfoParams, useConnectionInfo, useDBDriver } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { ConnectionAuthenticationFormLoader } from '../ConnectionAuthentication/ConnectionAuthenticationFormLoader';
import style from './DatabaseAuthDialog.m.css';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';

interface Payload {
  connection: IConnectionInfoParams;
  networkHandlers: string[];
  resetCredentials?: boolean;
}

export const DatabaseAuthDialog: DialogComponent<Payload> = observer(function DatabaseAuthDialog({ payload, options, rejectDialog, resolveDialog }) {
  const connection = useConnectionInfo(payload.connection);
  const controller = useController(DBAuthDialogController, payload.connection, payload.networkHandlers, resolveDialog);
  const styles = useS(style);

  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  let authModelId: string | null = null;

  if (connection.connectionInfo?.authNeeded || payload.resetCredentials) {
    authModelId = connection.connectionInfo?.authModel || driver?.defaultAuthModel || null;
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title="connections_database_authentication"
        subTitle={connection.connectionInfo?.name}
        icon={driver?.icon}
        onReject={options?.persistent ? undefined : rejectDialog}
      />
      <CommonDialogBody>
        <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={controller.login}>
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
              className={s(styles, { connectionAuthenticationFormLoader: true })}
              disabled={controller.isAuthenticating}
              hideFeatures={['nonSecuredProperty']}
            />
          )}
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter>
        <DBAuthDialogFooter isAuthenticating={controller.isAuthenticating} onLogin={controller.login}>
          {controller.error.responseMessage && (
            <ErrorMessage
              className={s(styles, { errorMessage: true })}
              text={controller.error.responseMessage}
              hasDetails={controller.error.hasDetails}
              onShowDetails={controller.showDetails}
            />
          )}
        </DBAuthDialogFooter>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
