/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import {
  BASE_CONTAINERS_STYLES,
  FieldCheckbox,
  GroupTitle,
  InputField,
  ObjectPropertyInfoForm,
  useResource,
  useStyles,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { NetworkHandlerAuthType, NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { SSHKeyUploader } from '../ConnectionForm/SSH/SSHKeyUploader';
import { PROPERTY_FEATURE_SECURED } from '../ConnectionForm/SSL/PROPERTY_FEATURE_SECURED';

interface Props {
  id: string;
  networkHandlersConfig: NetworkHandlerConfigInput[];
  allowSaveCredentials?: boolean;
  disabled?: boolean;
}

export const NetworkHandlerAuthForm = observer<Props>(function NetworkHandlerAuthForm({ id, networkHandlersConfig, allowSaveCredentials, disabled }) {
  const translate = useTranslate();
  const handler = useResource(NetworkHandlerAuthForm, NetworkHandlerResource, id);

  //@TODO Do not mutate state in component body
  if (!networkHandlersConfig.some(state => state.id === id)) {
    networkHandlersConfig.push({
      id,
      authType: NetworkHandlerAuthType.Password,
      userName: '',
      password: '',
      savePassword: false,
      secureProperties: {},
    });
  }

  const state = networkHandlersConfig.find(state => state.id === id)!;

  const ssh = state.id === SSH_TUNNEL_ID;
  const keyAuth = state.authType === NetworkHandlerAuthType.PublicKey;
  const passwordLabel = keyAuth
    ? 'Passphrase'
    : translate(`connections_network_handler_${id}_password`, 'connections_network_handler_default_password');
  const properties = handler.data?.properties.filter(p => p.features.includes(PROPERTY_FEATURE_SECURED));

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <>
      <GroupTitle>
        {handler.data?.label || translate(`connections_network_handler_${id}_title`, 'connections_network_handler_default_title')}
      </GroupTitle>
      {ssh && (
        <>
          <InputField type="text" name="userName" state={state} disabled={disabled} mod="surface">
            {translate(`connections_network_handler_${id}_user`, 'connections_network_handler_default_user')}
          </InputField>
          <InputField type="password" name="password" state={state} disabled={disabled} mod="surface">
            {passwordLabel}
          </InputField>
        </>
      )}
      {ssh && keyAuth && <SSHKeyUploader state={state} disabled={disabled} />}
      <ObjectPropertyInfoForm state={state.secureProperties} properties={properties ?? []} hideEmptyPlaceholder />
      {allowSaveCredentials && (
        <FieldCheckbox
          id={id + ' savePassword'}
          name="savePassword"
          state={state}
          label={translate('connections_connection_edit_save_credentials')}
          disabled={disabled}
        />
      )}
    </>,
  );
});
