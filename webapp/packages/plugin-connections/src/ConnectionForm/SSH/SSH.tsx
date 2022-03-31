/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
import {
  Group, SubmittingForm, useMapResource, Button, ColoredContainer, InputField,
  FieldCheckbox, BASE_CONTAINERS_STYLES, Switch, GroupItem, Container, Textarea,
  UploadArea, Combobox, Expandable, EXPANDABLE_FORM_STYLES
} from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { NetworkHandlerAuthType } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { getTextFileReadingProcess } from '@cloudbeaver/core-utils';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { authTypes } from './authTypes';

const SSH_STYLES = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

export const SSH: TabContainerPanelComponent<IConnectionFormProps> = observer(function SSH({
  state: formState,
}) {
  const {
    info,
    config,
    readonly,
    disabled: formDisabled,
  } = formState;
  const [loading, setLoading] = useState(false);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const initialConfig = info?.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);
  const state = config.networkHandlersConfig!.find(state => state.id === SSH_TUNNEL_ID)!;

  const resource = useMapResource(SSH, NetworkHandlerResource, SSH_TUNNEL_ID, {
    onData: handler => {
      if (Object.keys(state).length === 0) {
        for (const property of handler.properties) {
          if (!property.features.includes('password')) {
            state.properties[property.id!] = property.value;
          }
        }
      }
    },
  });

  const testConnection = async () => {
    setLoading(true);
    await resource.resource.test(state);
    setLoading(false);
  };

  const styles = useStyles(SSH_STYLES, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();
  const disabled = formDisabled || loading;
  const enabled = state.enabled || false;
  const keyAuth = state.authType === NetworkHandlerAuthType.PublicKey;
  const passwordFilled = (initialConfig?.password === null && state.password !== '') || !!state.password?.length;
  const testAvailable = keyAuth ? !!state.key?.length : passwordFilled;
  const passwordLabel = keyAuth ? 'Passphrase' : translate('connections_network_handler_ssh_tunnel_password');
  const passwordSaved = initialConfig?.password === '' && initialConfig.authType === state.authType;
  const keySaved = initialConfig?.key === '';

  const aliveIntervalLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_alive_interval');
  const connectTimeoutLabel = translate('connections_network_handler_ssh_tunnel_advanced_settings_connect_timeout');

  const handleKeyUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      throw new Error('File is not found');
    }

    const process = getTextFileReadingProcess(file);
    const key = await process.promise;

    if (key) {
      state.key = key;
    }
  };

  const authTypeChangeHandler = useCallback(() => {
    state.password = '';
  }, []);

  return styled(styles)(
    <SubmittingForm>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <Switch
            name="enabled"
            state={state}
            mod={['primary']}
            disabled={disabled || readonly}
          >
            {translate('connections_network_handler_ssh_tunnel_enable')}
          </Switch>
          <Combobox
            name="authType"
            state={state}
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
              state={state.properties}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
              required
              small
            >
              {translate('connections_network_handler_ssh_tunnel_host')}
            </InputField>
            <InputField
              type="number"
              name="port"
              state={state.properties}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
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
              state={state}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
              required={state.savePassword}
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_user')}
            </InputField>
            <InputField
              type="password"
              name="password"
              autoComplete='new-password'
              state={state}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
              required={!keyAuth && state.savePassword}
              description={passwordSaved ? translate('ui_processing_saved') : undefined}
              tiny
            >
              {passwordLabel}
            </InputField>
            {keyAuth && (
              <>
                <Textarea
                  name='key'
                  state={state}
                  disabled={disabled || !enabled}
                  readOnly={readonly}
                  description={keySaved ? translate('ui_processing_saved') : undefined}
                  required
                  medium
                >
                  {translate('connections_network_handler_ssh_tunnel_private_key')}
                </Textarea>
                <GroupItem>
                  <UploadArea
                    accept='.txt, .ssh'
                    disabled={disabled || readonly || !enabled}
                    reset
                    onChange={handleKeyUpload}
                  >
                    <Button
                      tag='div'
                      mod={['outlined']}
                    >
                      {translate('ui_file')}
                    </Button>
                  </UploadArea>
                </GroupItem>
              </>
            )}
          </Container>
          {credentialsSavingEnabled && (
            <FieldCheckbox
              id={SSH_TUNNEL_ID + ' savePassword'}
              name="savePassword"
              state={state}
              disabled={disabled || !enabled || readonly}
            >
              {translate('connections_connection_edit_save_credentials')}
            </FieldCheckbox>
          )}
          <Container gap>
            <Expandable
              style={EXPANDABLE_FORM_STYLES}
              label={translate('connections_network_handler_ssh_tunnel_advanced_settings')}
            >
              <Container gap>
                <InputField
                  type='number'
                  name='aliveInterval'
                  state={state.properties}
                  disabled={disabled || !enabled}
                  readOnly={readonly}
                  labelTooltip={aliveIntervalLabel}
                  mod='surface'
                  tiny
                >
                  {aliveIntervalLabel}
                </InputField>
                <InputField
                  type='number'
                  name='sshConnectTimeout'
                  state={state.properties}
                  disabled={disabled || !enabled}
                  readOnly={readonly}
                  labelTooltip={connectTimeoutLabel}
                  mod='surface'
                  tiny
                >
                  {connectTimeoutLabel}
                </InputField>
              </Container>
            </Expandable>
          </Container>
          <GroupItem>
            <Button
              type='button'
              mod={['unelevated']}
              disabled={disabled || !enabled || !testAvailable}
              loader
              onClick={testConnection}
            >
              {translate('connections_network_handler_test')}
            </Button>
          </GroupItem>
        </Group>
      </ColoredContainer>
    </SubmittingForm>
  );
});
