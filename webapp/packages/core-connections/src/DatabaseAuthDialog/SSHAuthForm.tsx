/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, FieldCheckboxNew, GroupTitle, InputFieldNew, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { NetworkHandlerResource } from '../NetworkHandlerResource';
import type { IFormInitConfig } from './IFormInitConfig';

interface Props {
  config: IFormInitConfig;
  sshHandlerId: string;
  allowPasswordSave: boolean;
  disabled: boolean;
  className?: string;
}

export const SSHAuthForm: React.FC<Props> = observer(function SSHAuthForm({
  config, sshHandlerId, allowPasswordSave, disabled, className,
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

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <>
      <GroupTitle>{translate(handler.data?.label || 'connections_network_handler_ssh_tunnel_title')}</GroupTitle>
      <InputFieldNew
        type="text"
        name="userName"
        state={state}
        disabled={disabled}
        mod='surface'
      >
        {translate('connections_network_handler_ssh_tunnel_user')}
      </InputFieldNew>
      <InputFieldNew
        type="password"
        name="password"
        state={state}
        disabled={disabled}
        mod='surface'
      >
        {translate('connections_network_handler_ssh_tunnel_password')}
      </InputFieldNew>
      {allowPasswordSave && (
        <FieldCheckboxNew
          id={sshHandlerId + ' savePassword'}
          name="savePassword"
          state={state}
          label={translate('connections_connection_edit_save_credentials')}
          disabled={disabled}
        />
      )}
    </>
  );
});
