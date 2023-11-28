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
  useAutoLoad,
  useErrorDetails,
  useFocus,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { IConnectionInfoParams } from '@cloudbeaver/core-connections';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { ConnectionAuthenticationFormLoader } from '../ConnectionAuthentication/ConnectionAuthenticationFormLoader';
import style from './DatabaseAuthDialog.m.css';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';
import { useDatabaseAuthDialog } from './useDatabaseAuthDialog';

interface Payload {
  connection: IConnectionInfoParams;
  networkHandlers: string[];
  resetCredentials?: boolean;
}

export const DatabaseAuthDialog: DialogComponent<Payload> = observer(function DatabaseAuthDialog({ payload, options, rejectDialog, resolveDialog }) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const { credentialsSavingEnabled } = useAdministrationSettings();
  const dialog = useDatabaseAuthDialog(payload.connection, payload.networkHandlers, payload.resetCredentials, resolveDialog);
  const errorDetails = useErrorDetails(dialog.authException);

  useAutoLoad(DatabaseAuthDialog, dialog);

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader
        title="connections_database_authentication"
        subTitle={dialog.connection?.name}
        icon={dialog.driver?.icon}
        onReject={options?.persistent ? undefined : rejectDialog}
      />
      <CommonDialogBody>
        <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={dialog.login}>
          <Loader state={dialog} inlineException>
            <ConnectionAuthenticationFormLoader
              config={dialog.config}
              authModelId={dialog.authModelId}
              authProperties={dialog.connection?.authProperties}
              networkHandlers={payload.networkHandlers}
              formId={`${payload.connection.projectId}:${payload.connection.connectionId}`}
              allowSaveCredentials={credentialsSavingEnabled}
              className={s(styles, { connectionAuthenticationFormLoader: true })}
              disabled={dialog.authenticating}
              hideFeatures={['nonSecuredProperty']}
            />
          </Loader>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter>
        <DBAuthDialogFooter isAuthenticating={dialog.authenticating} onLogin={dialog.login}>
          {dialog.authException && (
            <ErrorMessage
              text={errorDetails.message ?? translate('core_blocks_exception_message_error_message')}
              hasDetails={errorDetails.hasDetails}
              className={style.errorMessage}
              onShowDetails={errorDetails.open}
            />
          )}
        </DBAuthDialogFooter>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
