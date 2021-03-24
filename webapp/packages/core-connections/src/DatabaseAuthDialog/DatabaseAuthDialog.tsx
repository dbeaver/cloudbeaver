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
  ErrorMessage,
  Loader,
  useFocus,
  ObjectPropertyInfoForm,
  FieldCheckbox,
  FormBox,
  FormBoxElement,
  FormGroup,
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { SSH_TUNNEL_ID } from '../NetworkHandlerResource';
import { useConnectionInfo } from '../useConnectionInfo';
import { useDBDriver } from '../useDBDriver';
import { DBAuthDialogController } from './DBAuthDialogController';
import { DBAuthDialogFooter } from './DBAuthDialogFooter';
import { SSHAuthForm } from './SSHAuthForm';

const styles = composes(
  css`
    ErrorMessage {
      composes: theme-background-secondary from global;
    }
  `,
  css`
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
    SubmittingForm {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    ObjectPropertyInfoForm {
      align-items: center;
      justify-content: center;
      display: inline-flex;
    }
    FormBox {
      align-items: center;
      justify-content: center;
      width: 450px;
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
}: DialogComponentProps<string>) {
  const connection = useConnectionInfo(payload);

  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const { driver } = useDBDriver(connection.connectionInfo?.driverId || '');
  const controller = useController(DBAuthDialogController, payload, rejectDialog);
  const translate = useTranslate();
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const sshConfig = connection.connectionInfo?.networkHandlersConfig.find(
    handler => handler.id === SSH_TUNNEL_ID
  );

  const isAuthNeeded = connection.connectionInfo?.authNeeded;
  const isSSHAuthNeeded = sshConfig?.enabled && !sshConfig.savePassword;

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={connection.connectionInfo?.name}
      icon={driver?.icon}
      footer={(
        <DBAuthDialogFooter
          isAuthenticating={controller.isAuthenticating}
          onLogin={controller.login}
        />
      )}
      noBodyPadding
      onReject={options?.persistent ? undefined : rejectDialog}
    >
      {(!connection.isLoaded() || connection.isLoading())
        ? <Loader />
        : (
          <SubmittingForm ref={focusedRef} onSubmit={controller.login}>
            <FormBox>
              {isAuthNeeded && (
                <FormBoxElement>
                  <ObjectPropertyInfoForm
                    autofillToken={`section-${connection.connectionInfo?.id || ''} section-auth`}
                    properties={connection.connectionInfo?.authProperties}
                    state={controller.config.credentials}
                    disabled={controller.isAuthenticating}
                  />
                  {credentialsSavingEnabled && (
                    <FormGroup>
                      <FieldCheckbox
                        name="saveCredentials"
                        value={connection.connectionInfo?.id || 'DBAuthSaveCredentials'}
                        label={translate('connections_connection_edit_save_credentials')}
                        disabled={controller.isAuthenticating}
                        state={controller.config}
                      />
                    </FormGroup>
                  )}
                </FormBoxElement>
              )}
              {isSSHAuthNeeded && sshConfig && (
                <FormBoxElement>
                  <SSHAuthForm
                    config={controller.config}
                    sshHandlerId={sshConfig.id}
                    allowPasswordSave={credentialsSavingEnabled}
                    disabled={controller.isAuthenticating}
                  />
                </FormBoxElement>
              )}
            </FormBox>
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
