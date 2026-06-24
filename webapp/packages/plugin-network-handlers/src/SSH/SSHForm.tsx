/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import {
  Button,
  Container,
  Expandable,
  FieldCheckbox,
  GroupItem,
  InputField,
  Select,
  Switch,
  useAdministrationSettings,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { sshAuthTypes } from './sshAuthTypes.js';
import { SSHKeyUploader } from './SSHKeyUploader.js';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '../NetworkHandlerResource.js';
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
  connectionId?: string;
}

export const SSHForm = observer<ISSHFormProps>(function SSHForm({
  state,
  initialState,
  disabled,
  readonly,
  sharedCredentials = false,
  projectId,
  connectionId,
}) {
  const translate = useTranslate();
  const networkHandlerResource = useService(NetworkHandlerResource);
  const [testLoading, setTestLoading] = useState(false);

  const enabled = state.enabled;
  const disabledInternal = disabled || readonly || enabled === false;
  const keyAuth = state.authType === NetworkHandlerAuthType.PublicKey;

  const passwordFilled = (initialState?.password === null && state.password !== '') || !!state.password?.length;
  const testAvailable = keyAuth ? !!state.key?.length : passwordFilled;

  const serverConfigResource = useResource(SSHForm, ServerConfigResource, undefined);

  async function testTunnel() {
    setTestLoading(true);
    try {
      await networkHandlerResource.test(state, projectId, connectionId);
    } finally {
      setTestLoading(false);
    }
  }

  const passwordLabel = keyAuth ? 'Passphrase' : translate('plugin_network_handlers_ssh_tunnel_password');
  const passwordSaved = initialState?.password === '' && initialState?.authType === state.authType;
  const keySaved = initialState?.key === '';

  const aliveIntervalLabel = translate('plugin_network_handlers_ssh_tunnel_advanced_settings_alive_interval');
  const connectTimeoutLabel = translate('plugin_network_handlers_ssh_tunnel_advanced_settings_connect_timeout');
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const projectInfoResource = useService(ProjectInfoResource);
  const isSharedProject = projectInfoResource.isProjectShared(projectId);
  const showSaveCredentials = credentialsSavingEnabled && !sharedCredentials;

  const handleAuthTypeChange = useCallback(() => {
    state.password = '';
  }, [state]);

  return (
    <>
      <Switch id="ssh-enable-switch" name="enabled" state={state} mod={['primary']} disabled={disabled || readonly}>
        {translate('plugin_network_handlers_ssh_tunnel_enable')}
      </Switch>
      <Select
        name="authType"
        state={state}
        items={sshAuthTypes}
        keySelector={value => value.key}
        valueSelector={value => value.label}
        disabled={disabledInternal}
        tiny
        onSelect={handleAuthTypeChange}
      >
        {translate('plugin_network_handlers_ssh_tunnel_auth_type')}
      </Select>
      <Container wrap gap>
        <InputField type="text" name="host" state={state.properties} autoComplete="on" readOnly={disabledInternal} required small>
          {translate('plugin_network_handlers_ssh_tunnel_host')}
        </InputField>
        <InputField type="number" name="port" state={state.properties} autoComplete="on" readOnly={disabledInternal} required tiny>
          {translate('plugin_network_handlers_ssh_tunnel_port')}
        </InputField>
      </Container>
      <Container wrap gap>
        <InputField
          type="text"
          name="userName"
          state={state}
          readOnly={disabledInternal}
          required={state.savePassword}
          autoComplete="section-ssh-authentication username"
          tiny
          fill
        >
          {translate('plugin_network_handlers_ssh_tunnel_user')}
        </InputField>
        <InputField
          type="password"
          name="password"
          autoComplete="section-ssh-authentication new-password"
          state={state}
          readOnly={disabledInternal}
          required={!passwordSaved && !keyAuth && state.savePassword}
          description={passwordSaved ? translate('ui_processing_saved') : undefined}
          tiny
          fill
        >
          {passwordLabel}
        </InputField>
        {keyAuth && <SSHKeyUploader state={state} saved={keySaved} disabled={disabledInternal} readonly={readonly} />}
      </Container>
      {showSaveCredentials && (
        <FieldCheckbox
          id={SSH_TUNNEL_ID + '_savePassword'}
          title={translate(
            !isSharedProject || serverConfigResource.data?.distributed
              ? 'plugin_network_handlers_save_credentials_for_user_tooltip'
              : 'plugin_network_handlers_save_credentials_shared_tooltip',
          )}
          name="savePassword"
          state={state}
          disabled={disabledInternal}
        >
          {translate(
            !isSharedProject || serverConfigResource.data?.distributed
              ? 'plugin_network_handlers_save_credentials_for_user'
              : 'plugin_network_handlers_save_credentials_shared',
          )}
        </FieldCheckbox>
      )}
      <Container gap>
        <Expandable label={translate('plugin_network_handlers_ssh_tunnel_advanced_settings')}>
          <Container gap>
            <InputField
              type="number"
              name="aliveInterval"
              state={state.properties}
              readOnly={disabledInternal}
              labelTooltip={aliveIntervalLabel}
              tiny
            >
              {aliveIntervalLabel}
            </InputField>
            <InputField
              type="number"
              name="sshConnectTimeout"
              state={state.properties}
              readOnly={disabledInternal}
              labelTooltip={connectTimeoutLabel}
              tiny
            >
              {connectTimeoutLabel}
            </InputField>
          </Container>
        </Expandable>
      </Container>
      <GroupItem>
        <Button type="button" disabled={disabled || !enabled || testLoading || !testAvailable} loader onClick={testTunnel}>
          {translate('plugin_connection_network_handlers_ssh_test')}
        </Button>
      </GroupItem>
    </>
  );
});
