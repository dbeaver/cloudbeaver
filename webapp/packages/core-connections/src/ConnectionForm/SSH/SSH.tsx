/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled from 'reshadow';
import { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
import { Group, SubmittingForm, useMapResource, Button, ColoredContainer, InputFieldNew, FieldCheckboxNew, BASE_CONTAINERS_STYLES, SwitchNew, GroupItem, Container } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NetworkHandlerResource, SSH_TUNNEL_ID } from '../../NetworkHandlerResource';
import type { IConnectionFormTabProps } from '../ConnectionFormService';
import { useConnectionData } from '../useConnectionData';

const SSH_STYLES = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow: auto;
  }
`;

export const SSH: TabContainerPanelComponent<IConnectionFormTabProps> = observer(function SSH({
  data,
  form,
}) {
  const [loading, setLoading] = useState(false);
  const initialConfig = data.info?.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  useConnectionData(data, data => {
    if (!data.config.networkHandlersConfig) {
      data.config.networkHandlersConfig = [];
    }

    if (!data.config.networkHandlersConfig.some(state => state.id === SSH_TUNNEL_ID)) {
      data.config.networkHandlersConfig.push({
        id: SSH_TUNNEL_ID,
        enabled: false,
        password: '',
        savePassword: true,
        userName: '',
        ...initialConfig,

        properties: {
          port: 22,
          host: '',
          ...initialConfig?.properties,
        },
      });
    }
  });

  const state = data.config.networkHandlersConfig!.find(state => state.id === SSH_TUNNEL_ID)!;

  const resource = useMapResource(NetworkHandlerResource, SSH_TUNNEL_ID, {
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
  const disabled = form.form.disabled || loading;
  const enabled = state.enabled || false;
  const passwordFilled = (initialConfig?.password === null && state.password !== '') || (state.password?.length || 0) > 0;
  let passwordHint = '';

  if (initialConfig?.password === '') {
    passwordHint = '••••••';
  }

  return styled(styles)(
    <SubmittingForm onSubmit={form.save}>
      <ColoredContainer parent>
        <Group form gap keepSize large>
          <SwitchNew
            name="enabled"
            state={state}
            mod={['primary']}
            disabled={disabled || form.form.readonly}
          >
            {translate('connections_network_handler_ssh_tunnel_enable')}
          </SwitchNew>
          <Container wrap gap>
            <InputFieldNew
              type="text"
              name="host"
              state={state.properties}
              disabled={disabled || !enabled}
              readOnly={form.form.readonly}
              mod='surface'
              small
            >
              {translate('connections_network_handler_ssh_tunnel_host')}
            </InputFieldNew>
            <InputFieldNew
              type="number"
              name="port"
              state={state.properties}
              disabled={disabled || !enabled}
              readOnly={form.form.readonly}
              mod='surface'
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_port')}
            </InputFieldNew>
          </Container>
          <Container wrap gap>
            <InputFieldNew
              type="text"
              name="userName"
              state={state}
              disabled={disabled || !enabled}
              readOnly={form.form.readonly}
              mod='surface'
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_user')}
            </InputFieldNew>
            <InputFieldNew
              type="password"
              name="password"
              placeholder={passwordHint}
              state={state}
              disabled={disabled || !enabled}
              readOnly={form.form.readonly}
              mod='surface'
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_password')}
            </InputFieldNew>
          </Container>
          {credentialsSavingEnabled && (
            <FieldCheckboxNew
              name="savePassword"
              value={SSH_TUNNEL_ID + ' savePassword'}
              state={state}
              disabled={disabled || !enabled || form.form.readonly}
            >{translate('connections_network_handler_ssh_tunnel_save_password')}
            </FieldCheckboxNew>
          )}
          <GroupItem>
            <Button
              type='button'
              mod={['outlined']}
              disabled={disabled || !enabled || !passwordFilled}
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
