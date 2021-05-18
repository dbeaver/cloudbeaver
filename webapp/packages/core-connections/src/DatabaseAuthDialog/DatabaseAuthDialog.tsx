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
  BASE_CONTAINERS_STYLES,
  Container,
  Group,
  FieldCheckboxNew,
  ObjectPropertyInfoFormNew,
  GroupTitle,
  ErrorMessage,
  TextPlaceholder,
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
    Container {
      align-content: center;
    }
    ErrorMessage {
      flex: 1;
    }
`);

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

  const title = translate('connections_database_authentication');

  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <CommonDialogWrapper
      title={title}
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
            <Container>
              {isAuthNeeded && (
                <Group gap small>
                  {connection.connectionInfo?.authProperties ? (
                    <>
                      {isSSHAuthNeeded && sshConfig && <GroupTitle>{title}</GroupTitle>}
                      <ObjectPropertyInfoFormNew
                        autofillToken={`section-${connection.connectionInfo?.id || ''} section-auth`}
                        properties={connection.connectionInfo.authProperties}
                        state={controller.config.credentials}
                        disabled={controller.isAuthenticating}
                      />
                      {credentialsSavingEnabled && (
                        <FieldCheckboxNew
                          id={connection.connectionInfo?.id || 'DBAuthSaveCredentials'}
                          name="saveCredentials"
                          label={translate('connections_connection_edit_save_credentials')}
                          disabled={controller.isAuthenticating}
                          state={controller.config}
                        />
                      )}
                    </>
                  ) : (
                    <TextPlaceholder>Authentication data is not avaliable</TextPlaceholder>
                  )}
                </Group>
              )}
              {isSSHAuthNeeded && (
                <Group gap small>
                  {sshConfig ? (
                    <SSHAuthForm
                      config={controller.config}
                      sshHandlerId={sshConfig.id}
                      allowPasswordSave={credentialsSavingEnabled}
                      disabled={controller.isAuthenticating}
                    />
                  ) : (
                    <TextPlaceholder>SSH Authentication data is not avaliable</TextPlaceholder>
                  )}
                </Group>
              )}
            </Container>
          </SubmittingForm>
        )}
    </CommonDialogWrapper>
  );
});
