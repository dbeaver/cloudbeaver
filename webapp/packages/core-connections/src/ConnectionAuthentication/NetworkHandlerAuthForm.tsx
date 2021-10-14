/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, FieldCheckbox, GroupTitle, InputField, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { NetworkHandlerResource } from '../NetworkHandlerResource';

interface Props {
  id: string;
  networkHandlersConfig: NetworkHandlerConfigInput[];
  allowSaveCredentials?: boolean;
  disabled?: boolean;
}

export const NetworkHandlerAuthForm = observer<Props>(function NetworkHandlerAuthForm({ id, networkHandlersConfig, allowSaveCredentials, disabled }) {
  const translate = useTranslate();
  const handler = useMapResource(NetworkHandlerAuthForm, NetworkHandlerResource, id);

  if (!networkHandlersConfig.some(state => state.id === id)) {
    networkHandlersConfig.push({
      id: id,
      userName: '',
      password: '',
      savePassword: false,
    });
  }

  const state = networkHandlersConfig.find(state => state.id === id)!;

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <>
      <GroupTitle>{handler.data?.label || translate(`connections_network_handler_${id}_title`, 'connections_network_handler_default_title')}</GroupTitle>
      <InputField
        type="text"
        name="userName"
        state={state}
        disabled={disabled}
        mod='surface'
      >
        {translate(`connections_network_handler_${id}_user`, 'connections_network_handler_default_user')}
      </InputField>
      <InputField
        type="password"
        name="password"
        state={state}
        disabled={disabled}
        mod='surface'
      >
        {translate(`connections_network_handler_${id}_password`, 'connections_network_handler_default_password')}
      </InputField>
      {allowSaveCredentials && (
        <FieldCheckbox
          id={id + ' savePassword'}
          name="savePassword"
          state={state}
          label={translate('connections_connection_edit_save_credentials')}
          disabled={disabled}
        />
      )}
    </>
  );
});
