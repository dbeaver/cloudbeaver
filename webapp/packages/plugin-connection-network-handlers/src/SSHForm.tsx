/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import {
  Container,
  Expandable,
  FieldCheckbox,
  InputField,
  Select,
  useAdministrationSettings,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { authTypes } from './authTypes.js';
import { SSHKeyUploader } from './SSHKeyUploader.js';
import { SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';

export interface ISSHCredentialsSavingConfig {
  enabled: boolean;
  isSharedProject: boolean;
  isDistributed: boolean;
  checkboxId?: string;
}

export interface ISSHFormProps {
  state: NetworkHandlerConfigInput;
  initialState?: NetworkHandlerConfigInput | null;
  disabled?: boolean;
  readonly?: boolean;
  sharedCredentials?: boolean;
  projectId: string;
}

export const SSHForm = observer<ISSHFormProps>(function SSHForm({ state, initialState, disabled, readonly, sharedCredentials, projectId }) {
  const translate = useTranslate();

  const isDisabled = disabled || readonly;
  const keyAuth = state.authType === NetworkHandlerAuthType.PublicKey;
  const serverConfigResource = useResource(SSHForm, ServerConfigResource, undefined);

  const passwordLabel = keyAuth ? 'Passphrase' : translate('plugin_connection_network_handlers_ssh_tunnel_password');
  const passwordSaved = initialState?.password === '' && initialState?.authType === state.authType;
  const keySaved = initialState?.key === '';

  const aliveIntervalLabel = translate('plugin_connection_network_handlers_ssh_tunnel_advanced_settings_alive_interval');
  const connectTimeoutLabel = translate('plugin_connection_network_handlers_ssh_tunnel_advanced_settings_connect_timeout');
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const projectInfoResource = useService(ProjectInfoResource);
  const isSharedProject = projectInfoResource.isProjectShared(projectId);

  const handleAuthTypeChange = useCallback(() => {
    state.password = '';
  }, [state]);

  return (
    <>
      <Select
        name="authType"
        state={state}
        items={authTypes}
        keySelector={value => value.key}
        valueSelector={value => value.label}
        disabled={isDisabled}
        tiny
        onSelect={handleAuthTypeChange}
      >
        {translate('plugin_connection_network_handlers_ssh_tunnel_auth_type')}
      </Select>
      <Container wrap gap>
        <InputField type="text" name="host" state={state.properties} autoComplete="on" readOnly={isDisabled} required small>
          {translate('plugin_connection_network_handlers_ssh_tunnel_host')}
        </InputField>
        <InputField type="number" name="port" state={state.properties} autoComplete="on" readOnly={isDisabled} required tiny>
          {translate('plugin_connection_network_handlers_ssh_tunnel_port')}
        </InputField>
      </Container>
      <Container wrap gap>
        <InputField
          type="text"
          name="userName"
          state={state}
          readOnly={isDisabled}
          required={state.savePassword}
          autoComplete="section-ssh-authentication username"
          tiny
          fill
        >
          {translate('plugin_connection_network_handlers_ssh_tunnel_user')}
        </InputField>
        <InputField
          type="password"
          name="password"
          autoComplete="section-ssh-authentication new-password"
          state={state}
          readOnly={isDisabled}
          required={!passwordSaved && !keyAuth && state.savePassword}
          description={passwordSaved ? translate('ui_processing_saved') : undefined}
          tiny
          fill
        >
          {passwordLabel}
        </InputField>
        {keyAuth && <SSHKeyUploader state={state} saved={keySaved} disabled={isDisabled} readonly={readonly} />}
      </Container>
      {credentialsSavingEnabled && !sharedCredentials && (
        <FieldCheckbox
          id={SSH_TUNNEL_ID + '_savePassword'}
          title={translate(
            !isSharedProject || serverConfigResource.data?.distributed
              ? 'plugin_connection_network_handlers_save_credentials_for_user_tooltip'
              : 'plugin_connection_network_handlers_save_credentials_shared_tooltip',
          )}
          name="savePassword"
          state={state}
          disabled={isDisabled}
        >
          {translate(
            !isSharedProject || serverConfigResource.data?.distributed
              ? 'plugin_connection_network_handlers_save_credentials_for_user'
              : 'plugin_connection_network_handlers_save_credentials_shared',
          )}
        </FieldCheckbox>
      )}
      <Container gap>
        <Expandable label={translate('plugin_connection_network_handlers_ssh_tunnel_advanced_settings')}>
          <Container gap>
            <InputField type="number" name="aliveInterval" state={state.properties} readOnly={isDisabled} labelTooltip={aliveIntervalLabel} tiny>
              {aliveIntervalLabel}
            </InputField>
            <InputField type="number" name="sshConnectTimeout" state={state.properties} readOnly={isDisabled} labelTooltip={connectTimeoutLabel} tiny>
              {connectTimeoutLabel}
            </InputField>
          </Container>
        </Expandable>
      </Container>
    </>
  );
});
