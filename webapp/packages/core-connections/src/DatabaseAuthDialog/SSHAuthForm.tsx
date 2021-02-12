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
import type { NetworkHandlerConfig } from '@cloudbeaver/core-sdk';

import { NetworkHandlerResource } from '../NetworkHandlerResource';
import type { IDBAuthConfig } from './DBAuthDialogController';

interface Props {
  config: Required<IDBAuthConfig>;
  sshConfig: Pick<NetworkHandlerConfig, 'id' | 'enabled' | 'savePassword'>;
  allowSavePassword: boolean;
  disabled: boolean;
}

const styles = css`
  form-container {
    display: inline-flex;
    flex-direction: column;
  }
`;

export const SSHAuthForm: React.FC<Props> = observer(function SSHAuthForm({
  config, sshConfig, allowSavePassword, disabled,
}) {
  const translate = useTranslate();
  const handler = useMapResource(NetworkHandlerResource, sshConfig.id);

  if (!config.networkCredentials.some(state => state.id === sshConfig.id)) {
    config.networkCredentials.push({
      userName: '',
      password: '',
      ...sshConfig,
    });
  }

  const state = config.networkCredentials.find(state => state.id === sshConfig.id)!;

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
      {allowSavePassword && (
        <FormGroup>
          <FieldCheckbox
            name="savePassword"
            value={sshConfig.id + ' savePassword'}
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
