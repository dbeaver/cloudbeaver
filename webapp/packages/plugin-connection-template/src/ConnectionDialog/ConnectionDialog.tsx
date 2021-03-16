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
  ErrorMessage, SubmittingForm, Loader, useFocus, ObjectPropertyInfoForm, FormBox, FormBoxElement, FormGroup, FieldCheckbox
} from '@cloudbeaver/core-blocks';
import { SSH_TUNNEL_ID, SSHAuthForm } from '@cloudbeaver/core-connections';
import { useController } from '@cloudbeaver/core-di';
import { CommonDialogWrapper, DialogComponentProps } from '@cloudbeaver/core-dialogs';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionController, ConnectionStep } from './ConnectionController';
import { ConnectionDialogFooter } from './ConnectionDialogFooter';
import { TemplateConnectionSelector } from './TemplateConnectionSelector/TemplateConnectionSelector';

const styles = css`
  CommonDialogWrapper {
    max-height: 600px;
    min-height: 500px;
  }
  SubmittingForm, center {
    display: flex;
    flex: 1;
    margin: auto;
  }
  center {
    box-sizing: border-box;
    flex-direction: column;
    align-items: center;
    justify-content: center;
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
`;

export const ConnectionDialog = observer(function ConnectionDialog({
  rejectDialog,
}: DialogComponentProps<null, null>) {
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });
  const controller = useController(ConnectionController, rejectDialog);
  const translate = useTranslate();
  const { credentialsSavingEnabled } = useAdministrationSettings();

  let title = translate('basicConnection_connectionDialog_newConnection');

  if (controller.step === ConnectionStep.Connection && controller.template?.name) {
    title = controller.template.name;
  }

  const sshConfig = controller.template?.networkHandlersConfig.find(
    handler => handler.id === SSH_TUNNEL_ID
  );

  const isSSHAuthNeeded = sshConfig?.enabled && !sshConfig.savePassword;

  return styled(useStyles(styles))(
    <CommonDialogWrapper
      title={title}
      icon={controller.dbDriver?.icon}
      noBodyPadding={controller.step === ConnectionStep.ConnectionTemplateSelect}
      footer={controller.step === ConnectionStep.Connection && (
        <ConnectionDialogFooter
          isConnecting={controller.isConnecting}
          onBack={() => controller.onStep(ConnectionStep.ConnectionTemplateSelect)}
          onConnect={controller.onConnect}
        />
      )}
      onReject={rejectDialog}
    >
      {controller.isLoading && <Loader />}
      {!controller.isLoading && controller.step === ConnectionStep.ConnectionTemplateSelect && (
        <TemplateConnectionSelector
          templateConnections={controller.templateConnections}
          dbDrivers={controller.dbDrivers}
          onSelect={controller.onTemplateSelect}
        />
      )}
      {controller.step === ConnectionStep.Connection && (!controller.authModel ? (
        <center as="div">
          {controller.isConnecting && translate('basicConnection_connectionDialog_connecting_message')}
        </center>
      ) : (
        <SubmittingForm ref={focusedRef} onSubmit={controller.onConnect}>
          <FormBox>
            <FormBoxElement>
              <ObjectPropertyInfoForm
                autofillToken={`section-${controller.template?.id || ''} section-auth`}
                properties={controller.authModel.properties}
                state={controller.config.credentials}
                disabled={controller.isConnecting}
              />
              {credentialsSavingEnabled && (
                <FormGroup>
                  <FieldCheckbox
                    name="saveCredentials"
                    value={controller.template?.id || 'DBAuthSaveCredentials'}
                    checkboxLabel={translate('connections_connection_edit_save_credentials')}
                    disabled={controller.isConnecting}
                    state={controller.config}
                  />
                </FormGroup>
              )}
            </FormBoxElement>
            {isSSHAuthNeeded && sshConfig && (
              <FormBoxElement>
                <SSHAuthForm
                  sshHandlerId={sshConfig.id}
                  config={controller.config}
                  disabled={controller.isConnecting}
                  allowPasswordSave={credentialsSavingEnabled}
                />
              </FormBoxElement>
            )}
          </FormBox>
        </SubmittingForm>
      ))}
      {controller.responseMessage && (
        <ErrorMessage
          text={controller.responseMessage}
          hasDetails={controller.hasDetails}
          onShowDetails={controller.onShowDetails}
        />
      )}
    </CommonDialogWrapper>
  );
});
