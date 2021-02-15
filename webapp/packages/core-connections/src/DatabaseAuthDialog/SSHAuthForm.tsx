/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { FieldCheckbox, FormGroup, InputField, InputGroup, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';

import { NetworkHandlerResource } from '../NetworkHandlerResource';
import type { IFormInitConfig } from './IFormInitConfig';

interface Props {
  config: IFormInitConfig;
  sshHandlerId: string;
  allowPasswordSave: boolean;
  disabled: boolean;
}

const styles = css`
  form-container {
    display: inline-flex;
    flex-direction: column;
  }
`;

export const SSHAuthForm: React.FC<Props> = observer(function SSHAuthForm({
  config, sshHandlerId, allowPasswordSave, disabled,
}) {
  const translate = useTranslate();
  const handler = useMapResource(NetworkHandlerResource, sshHandlerId);

  if (!config.networkCredentials.some(state => state.id === sshHandlerId)) {
    config.networkCredentials.push({
      id: sshHandlerId,
      userName: '',
      password: '',
      savePassword: false,
    });
  }

  const state = config.networkCredentials.find(state => state.id === sshHandlerId)!;

  return styled(styles)(
    <form-container as='div'>
      <FormGroup>
        <InputGroup>{translate(handler.data?.label || 'connections_network_handler_ssh_tunnel_title')}</InputGroup>
      </FormGroup>
      <FormGroup>
        <InputField
          type="text"
          name="userName"
          state={state}
          disabled={disabled}
          mod='surface'
        >
          {translate('connections_network_handler_ssh_tunnel_user')}
        </InputField>
      </FormGroup>
      <FormGroup>
        <InputField
          type="password"
          name="password"
          state={state}
          disabled={disabled}
          mod='surface'
        >
          {translate('connections_network_handler_ssh_tunnel_password')}
        </InputField>
      </FormGroup>
      {allowPasswordSave && (
        <FormGroup>
          <FieldCheckbox
            name="savePassword"
            value={sshHandlerId + ' savePassword'}
            state={state}
            checkboxLabel={translate('connections_network_handler_ssh_tunnel_save_password')}
            disabled={disabled}
            mod='surface'
          />
        </FormGroup>
      )}
    </form-container>
  );
});
