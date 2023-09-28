/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  Button,
  ColoredContainer,
  Combobox,
  Container,
  Expandable,
  EXPANDABLE_FORM_STYLES,
  FieldCheckbox,
  Form,
  Group,
  GroupItem,
  InputField,
  Switch,
  useAdministrationSettings,
  useResource,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { NetworkHandlerAuthType, NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { isSafari } from '@cloudbeaver/core-utils';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { authTypes } from './authTypes';
import { SSHKeyUploader } from './SSHKeyUploader';

const SSH_STYLES = css`
  Form {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

interface Props extends IConnectionFormProps {
  handlerState: NetworkHandlerConfigInput;
}

export const SSH: TabContainerPanelComponent<Props> = observer(function SSH({ state: formState, handlerState }) {
  const { info, readonly, disabled: formDisabled } = formState;
  const [loading, setLoading] = useState(false);
  const { credentialsSavingEnabled } = useAdministrationSettings();

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

  const styles = useStyles(SSH_STYLES);
  const translate = useTranslate();
  const disabled = formDisabled || loading;
  const enabled = handlerState.enabled || false;
  const keyAuth = handlerState.authType === NetworkHandlerAuthType.PublicKey;
  const passwordFilled = (initialConfig?.password === null && handlerState.password !== '') || !!handlerState.password?.length;
  const testAvailable = keyAuth ? !!handlerState.key?.length : passwordFilled;
  const passwordLabel = keyAuth ? 'Passphrase' : translate('connections_network_handler_ssh_tunnel_password');
  const passwordSaved = initialConfig?.password === '' && initialConfig.authType === handlerState.authType;
  const keySaved = initialConfig?.key === '';

  const aliveIntervalLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_alive_interval');
  const connectTimeoutLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_connect_timeout');

  const authTypeChangeHandler = useCallback(() => {
    handlerState.password = '';
  }, []);

  return styled(styles)(
    <Form>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <Switch name="enabled" state={handlerState} mod={['primary']} disabled={disabled || readonly}>
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
            <InputField
              type="text"
              name="host"
              state={handlerState.properties}
              disabled={disabled || !enabled}
              readOnly={readonly}
              required
              small
            >
              {translate('connections_network_handler_ssh_tunnel_host')}
            </InputField>
            <InputField
              type="number"
              name="port"
              state={handlerState.properties}
              disabled={disabled || !enabled}
              readOnly={readonly}
              required
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_port')}
            </InputField>
          </Container>
          <Container wrap gap>
            <InputField
              type="text"
              name="userName"
              state={handlerState}
              disabled={disabled || !enabled}
              readOnly={readonly}
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
              disabled={disabled || !enabled}
              readOnly={readonly}
              required={!keyAuth && handlerState.savePassword}
              description={passwordSaved ? translate('ui_processing_saved') : undefined}
              tiny
              fill
            >
              {passwordLabel}
            </InputField>
            {keyAuth && <SSHKeyUploader state={handlerState} saved={keySaved} disabled={disabled || !enabled} readonly={readonly} />}
          </Container>
          {credentialsSavingEnabled && !formState.config.template && (
            <FieldCheckbox
              id={SSH_TUNNEL_ID + ' savePassword'}
              name="savePassword"
              state={handlerState}
              disabled={disabled || !enabled || readonly || formState.config.sharedCredentials}
            >
              {translate('connections_connection_edit_save_credentials')}
            </FieldCheckbox>
          )}
          <Container gap>
            <Expandable style={EXPANDABLE_FORM_STYLES} label={translate('connections_network_handler_ssh_tunnel_advanced_settings')}>
              <Container gap>
                <InputField
                  type="number"
                  name="aliveInterval"
                  state={handlerState.properties}
                  disabled={disabled || !enabled}
                  readOnly={readonly}
                  labelTooltip={aliveIntervalLabel}
                  tiny
                >
                  {aliveIntervalLabel}
                </InputField>
                <InputField
                  type="number"
                  name="sshConnectTimeout"
                  state={handlerState.properties}
                  disabled={disabled || !enabled}
                  readOnly={readonly}
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
    </Form>,
  );
});
