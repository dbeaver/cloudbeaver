/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { FormBox, FormBoxElement, FormGroup, SubmittingForm, InputField, useMapResource, FieldCheckbox, Switch } from '@cloudbeaver/core-blocks';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { NetworkHandlerResource } from '../../../../NetworkHandlerResource';
import type { IConnectionFormProps } from '../ConnectionFormService';
import { SSH_TUNNEL_ID } from './SSH_TUNNEL_ID';

export const SSH: TabContainerPanelComponent<IConnectionFormProps> = observer(function SSH({
  model,
  controller,
}) {
  if (!model.networkHandlersState.some(state => state.id === SSH_TUNNEL_ID)) {
    const config = model.connection.networkHandlersConfig.find(handler => handler.id === SSH_TUNNEL_ID);
    model.networkHandlersState.push({
      id: SSH_TUNNEL_ID,
      properties: {
        port: 22,
      },
      ...config,
    });
  }
  const state = model.networkHandlersState.find(state => state.id === SSH_TUNNEL_ID)!;

  useMapResource(NetworkHandlerResource, SSH_TUNNEL_ID, {
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

  const translate = useTranslate();
  const disabled = controller.isDisabled;
  const enabled = state.enabled || false;

  return (
    <SubmittingForm onSubmit={controller.save}>
      <FormBox>
        <FormBoxElement max>
          <FormGroup><br /></FormGroup>
          <FormGroup>
            <Switch
              name="enabled"
              state={state}
              mod={['primary']}
              disabled={disabled}
            >
              {translate('connections_network_handler_ssh_tunnel_enable')}
            </Switch>
          </FormGroup>
        </FormBoxElement>
        <FormBoxElement>
          <FormGroup>
            <InputField
              type="text"
              name="host"
              state={state.properties}
              disabled={disabled || !enabled}
              mod='surface'
            >
              {translate('connections_network_handler_ssh_tunnel_host')}
            </InputField>
          </FormGroup>
          <FormGroup>
            <InputField
              type="number"
              name="port"
              state={state.properties}
              disabled={disabled || !enabled}
              mod='surface'
            >
              {translate('connections_network_handler_ssh_tunnel_port')}
            </InputField>
          </FormGroup>
        </FormBoxElement>
        <FormBoxElement>
          <FormGroup>
            <InputField
              type="text"
              name="userName"
              state={state}
              disabled={disabled || !enabled}
              mod='surface'
            >
              {translate('connections_network_handler_ssh_tunnel_user')}
            </InputField>
          </FormGroup>
          <FormGroup>
            <InputField
              type="text"
              name="password"
              placeholder={model.editing && state.savePassword ? '••••••' : ''}
              state={state}
              disabled={disabled || !enabled}
              mod='surface'
            >
              {translate('connections_network_handler_ssh_tunnel_password')}
            </InputField>
          </FormGroup>
          <FormGroup>
            <FieldCheckbox
              name="savePassword"
              value={SSH_TUNNEL_ID + ' savePassword'}
              state={state}
              checkboxLabel={translate('connections_network_handler_ssh_tunnel_save_password')}
              disabled={disabled || !enabled}
              mod='surface'
            />
          </FormGroup>
        </FormBoxElement>
      </FormBox>
    </SubmittingForm>
  );
});
