/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  CommonDialogBody,
  CommonDialogFooter,
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

import { ConnectionAuthenticationFormLoader } from '../../ConnectionAuthentication/ConnectionAuthenticationFormLoader.js';
import style from './DatabaseCredentialsAuthDialog.module.css';
import { DatabaseCredentialsAuthDialogFooter } from './DatabaseCredentialsAuthDialogFooter.js';
import { useDatabaseCredentialsAuthDialog } from './useDatabaseCredentialsAuthDialog.js';

interface Props {
  connection: IConnectionInfoParams;
  networkHandlers: string[];
  resetCredentials?: boolean;
  onLogin?: () => void;
}

export const DatabaseCredentialsAuthDialog = observer<Props>(function DatabaseCredentialsAuthDialog({
  connection,
  networkHandlers,
  resetCredentials,
  onLogin,
}) {
  const styles = useS(style);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  const { credentialsSavingEnabled } = useAdministrationSettings();
  const dialog = useDatabaseCredentialsAuthDialog(connection, networkHandlers, resetCredentials, onLogin);
  const errorDetails = useErrorDetails(dialog.authException);

  useAutoLoad(DatabaseCredentialsAuthDialog, dialog);

  return (
    <>
      <CommonDialogBody>
        <Form ref={focusedRef} className={s(styles, { submittingForm: true })} onSubmit={dialog.login}>
          <Loader state={dialog} inlineException>
            <ConnectionAuthenticationFormLoader
              config={dialog.config}
              authModelId={dialog.authModelId}
              authProperties={dialog.connectionAuthProperties?.authProperties}
              networkHandlers={networkHandlers}
              formId={`${connection.projectId}:${connection.connectionId}`}
              projectId={connection.projectId}
              allowSaveCredentials={credentialsSavingEnabled}
              className={s(styles, { connectionAuthenticationFormLoader: true })}
              disabled={dialog.authenticating}
              hideFeatures={['nonSecuredProperty']}
            />
          </Loader>
        </Form>
      </CommonDialogBody>
      <CommonDialogFooter>
        <DatabaseCredentialsAuthDialogFooter isAuthenticating={dialog.authenticating} onLogin={dialog.login}>
          {dialog.authException && (
            <ErrorMessage
              text={errorDetails.message ?? translate('core_blocks_exception_message_error_message')}
              hasDetails={errorDetails.hasDetails}
              className={style['errorMessage']}
              onShowDetails={errorDetails.open}
            />
          )}
        </DatabaseCredentialsAuthDialogFooter>
      </CommonDialogFooter>
    </>
  );
});
