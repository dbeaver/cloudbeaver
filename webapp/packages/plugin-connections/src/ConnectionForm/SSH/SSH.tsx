/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import {
  Button,
  ColoredContainer,
  Combobox,
  Container,
  Expandable,
  FieldCheckbox,
  Form,
  Group,
  GroupItem,
  InputField,
  s,
  Switch,
  useAdministrationSettings,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { isSafari } from '@cloudbeaver/core-utils';

import type { IConnectionFormProps } from '../IConnectionFormProps.js';
import { authTypes } from './authTypes.js';
import styles from './SSH.module.css';
import { SSHKeyUploader } from './SSHKeyUploader.js';

interface Props extends IConnectionFormProps {
  handlerState: NetworkHandlerConfigInput;
}

export const SSH: TabContainerPanelComponent<Props> = observer(function SSH({ state: formState, handlerState }) {
  const { info, readonly, disabled: formDisabled } = formState;
  const [loading, setLoading] = useState(false);
  const { credentialsSavingEnabled } = useAdministrationSettings();
  const serverConfigResource = useResource(SSH, ServerConfigResource, undefined);

  const initialConfig = info?.networkHandlersConfig?.find(handler => handler.id === SSH_TUNNEL_ID);

  const resource = useResource(SSH, NetworkHandlerResource, SSH_TUNNEL_ID, {
    onData: handler => {
      if (Object.keys(handlerState).length === 0) {
        for (const property of handler.properties) {
          if (!property.features.includes('password')) {
            handlerState.properties[property.id!] = property.value;
          }
        }
      }
    },
  });

  const testConnection = async () => {
    setLoading(true);
    await resource.resource.test(handlerState);
    setLoading(false);
  };

  const style = useS(styles);
  const translate = useTranslate();
  const disabled = formDisabled || loading;
  const enabled = handlerState.enabled || false;
  const keyAuth = handlerState.authType === NetworkHandlerAuthType.PublicKey;
  const passwordFilled = (initialConfig?.password === null && handlerState.password !== '') || !!handlerState.password?.length;
  const testAvailable = keyAuth ? !!handlerState.key?.length : passwordFilled;
  const passwordLabel = keyAuth ? 'Passphrase' : translate('connections_network_handler_ssh_tunnel_password');
  const passwordSaved = initialConfig?.password === '' && initialConfig.authType === handlerState.authType;
  const keySaved = initialConfig?.key === '';
  const projectInfoResource = useService(ProjectInfoResource);
  const isSharedProject = projectInfoResource.isProjectShared(formState.projectId);

  const aliveIntervalLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_alive_interval');
  const connectTimeoutLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_connect_timeout');

  const authTypeChangeHandler = useCallback(() => {
    handlerState.password = '';
  }, []);

  return (
    <Form className={s(style, { form: true })}>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <Switch id="ssh-enable-switch" name="enabled" state={handlerState} mod={['primary']} disabled={disabled || readonly}>
            {translate('connections_network_handler_ssh_tunnel_enable')}
          </Switch>
          <Combobox
            name="authType"
            state={handlerState}
            items={authTypes}
            keySelector={value => value.key}
            valueSelector={value => value.label}
            disabled={disabled || readonly || !enabled}
            tiny
            onSelect={authTypeChangeHandler}
          >
            {translate('connections_network_handler_ssh_tunnel_auth_type')}
          </Combobox>
          <Container wrap gap>
            <InputField type="text" name="host" state={handlerState.properties} readOnly={readonly || disabled || !enabled} required small>
              {translate('connections_network_handler_ssh_tunnel_host')}
            </InputField>
            <InputField type="number" name="port" state={handlerState.properties} readOnly={readonly || disabled || !enabled} required tiny>
              {translate('connections_network_handler_ssh_tunnel_port')}
            </InputField>
          </Container>
          <Container wrap gap>
            <InputField
              type="text"
              name="userName"
              state={handlerState}
              readOnly={readonly || disabled || !enabled}
              required={handlerState.savePassword}
              tiny
              fill
            >
              {translate('connections_network_handler_ssh_tunnel_user')}
            </InputField>
            <InputField
              type="password"
              name="password"
              autoComplete={isSafari ? 'section-connection-ssh-authentication section-ssh password' : 'new-password'}
              state={handlerState}
              readOnly={readonly || disabled || !enabled}
              required={!passwordSaved && !keyAuth && handlerState.savePassword}
              description={passwordSaved ? translate('ui_processing_saved') : undefined}
              tiny
              fill
            >
              {passwordLabel}
            </InputField>
            {keyAuth && <SSHKeyUploader state={handlerState} saved={keySaved} disabled={disabled || !enabled} readonly={readonly} />}
          </Container>
          {credentialsSavingEnabled && !formState.config.template && !formState.config.sharedCredentials && (
            <FieldCheckbox
              id={SSH_TUNNEL_ID + '_savePassword'}
              title={translate(
                !isSharedProject || serverConfigResource.data?.distributed
                  ? 'connections_connection_authentication_save_credentials_for_user_tooltip'
                  : 'connections_connection_edit_save_credentials_shared_tooltip',
              )}
              name="savePassword"
              state={handlerState}
              disabled={disabled || !enabled || readonly}
            >
              {translate(
                !isSharedProject || serverConfigResource.data?.distributed
                  ? 'connections_connection_authentication_save_credentials_for_user'
                  : 'connections_connection_edit_save_credentials_shared',
              )}
            </FieldCheckbox>
          )}
          <Container gap>
            <Expandable label={translate('connections_network_handler_ssh_tunnel_advanced_settings')}>
              <Container gap>
                <InputField
                  type="number"
                  name="aliveInterval"
                  state={handlerState.properties}
                  readOnly={readonly || disabled || !enabled}
                  labelTooltip={aliveIntervalLabel}
                  tiny
                >
                  {aliveIntervalLabel}
                </InputField>
                <InputField
                  type="number"
                  name="sshConnectTimeout"
                  state={handlerState.properties}
                  readOnly={readonly || disabled || !enabled}
                  labelTooltip={connectTimeoutLabel}
                  tiny
                >
                  {connectTimeoutLabel}
                </InputField>
              </Container>
            </Expandable>
          </Container>
          <GroupItem>
            <Button type="button" mod={['unelevated']} disabled={disabled || !enabled || !testAvailable} loader onClick={testConnection}>
              {translate('connections_network_handler_test')}
            </Button>
          </GroupItem>
        </Group>
      </ColoredContainer>
    </Form>
  );
});
