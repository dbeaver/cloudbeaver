/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React from 'react';
import styled, { css } from 'reshadow';

import { FieldCheckbox, FormGroup, InputField, InputGroup } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { NetworkHandlerConfig } from '@cloudbeaver/core-sdk';

import type { DBAuthDialogController } from './DBAuthDialogController';

interface Props {
  controller: DBAuthDialogController;
  SSHConfig: NetworkHandlerConfig;
  allowSavePassword: boolean;
}

const styles = css`
  form-container {
    display: inline-flex;
    flex-direction: column;
  }
`;

export const SSHAuthForm: React.FC<Props> = observer(function SSHAuthForm({
  controller, SSHConfig, allowSavePassword,
}) {
  const translate = useTranslate();
  const disabled = controller.isAuthenticating;

  if (!controller.config.networkCredentials.some(state => state.id === SSHConfig.id)) {
    controller.config.networkCredentials.push({ ...SSHConfig });
  }

  const state = controller.config.networkCredentials.find(state => state.id === SSHConfig.id)!;

  return styled(styles)(
    <form-container as='div'>
      <FormGroup>
        <InputGroup>SSH</InputGroup>
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
            value={SSHConfig.id + ' savePassword'}
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
