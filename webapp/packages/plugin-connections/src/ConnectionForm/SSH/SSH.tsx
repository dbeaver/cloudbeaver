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
import { Group, SubmittingForm, useMapResource, Button, ColoredContainer, InputField, FieldCheckbox, BASE_CONTAINERS_STYLES, Switch, GroupItem, Container } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IConnectionFormProps } from '../IConnectionFormProps';

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
  const passwordFilled = (initialConfig?.password === null && state.password !== '') || (state.password?.length || 0) > 0;
  let passwordHint = '';

  if (initialConfig?.password === '') {
    passwordHint = '••••••';
  }

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
          <Container wrap gap>
            <InputField
              type="text"
              name="host"
              state={state.properties}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
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
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_user')}
            </InputField>
            <InputField
              type="password"
              name="password"
              placeholder={passwordHint}
              autoComplete='new-password'
              state={state}
              disabled={disabled || !enabled}
              readOnly={readonly}
              mod='surface'
              tiny
            >
              {translate('connections_network_handler_ssh_tunnel_password')}
            </InputField>
          </Container>
          {credentialsSavingEnabled && (
            <FieldCheckbox
              id={SSH_TUNNEL_ID + ' savePassword'}
              name="savePassword"
              state={state}
              disabled={disabled || !enabled || readonly}
            >{translate('connections_connection_edit_save_credentials')}
            </FieldCheckbox>
          )}
          <GroupItem>
            <Button
              type='button'
              mod={['outlined']}
              disabled={disabled || !enabled || !passwordFilled}
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
