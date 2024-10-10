/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { FieldCheckbox, GroupTitle, InputField, ObjectPropertyInfoForm, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { NetworkHandlerResource, SSH_TUNNEL_ID } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { NetworkHandlerAuthType, type NetworkHandlerConfigInput } from '@cloudbeaver/core-sdk';

import { SSHKeyUploader } from '../ConnectionForm/SSH/SSHKeyUploader.js';
import { PROPERTY_FEATURE_SECURED } from '../ConnectionForm/SSL/PROPERTY_FEATURE_SECURED.js';

interface Props {
  id: string;
  networkHandlersConfig: NetworkHandlerConfigInput[];
  allowSaveCredentials?: boolean;
  disabled?: boolean;
  projectId: string | null;
}

export const NetworkHandlerAuthForm = observer<Props>(function NetworkHandlerAuthForm({
  id,
  networkHandlersConfig,
  allowSaveCredentials,
  disabled,
  projectId,
}) {
  const translate = useTranslate();
  const handler = useResource(NetworkHandlerAuthForm, NetworkHandlerResource, id);
  const serverConfigResource = useResource(NetworkHandlerAuthForm, ServerConfigResource, undefined);
  const distributed = Boolean(serverConfigResource?.data?.distributed);
  const projectInfoResource = useService(ProjectInfoResource);
  const isSharedProject = projectInfoResource.isProjectShared(projectId);

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

  return (
    <>
      <GroupTitle>
        {handler.data?.label || translate(`connections_network_handler_${id}_title`, 'connections_network_handler_default_title')}
      </GroupTitle>
      {ssh && (
        <>
          <InputField type="text" name="userName" state={state} readOnly={disabled}>
            {translate(`connections_network_handler_${id}_user`, 'connections_network_handler_default_user')}
          </InputField>
          <InputField type="password" name="password" canShowPassword={false} state={state} readOnly={disabled}>
            {passwordLabel}
          </InputField>
        </>
      )}
      {ssh && keyAuth && <SSHKeyUploader state={state} disabled={disabled} />}
      {!ssh && (
        <ObjectPropertyInfoForm state={state.secureProperties} properties={properties ?? []} autofillToken="new-password" hideEmptyPlaceholder />
      )}
      {allowSaveCredentials && (
        <FieldCheckbox
          id={id + '_savePassword'}
          name="savePassword"
          state={state}
          label={translate(
            !isSharedProject || distributed
              ? 'connections_connection_authentication_save_credentials_for_user'
              : 'connections_connection_authentication_save_credentials_for_session',
          )}
          title={translate(
            !isSharedProject || distributed
              ? 'connections_connection_authentication_save_credentials_for_user_tooltip'
              : 'connections_connection_authentication_save_credentials_for_session_tooltip',
          )}
          disabled={disabled}
        />
      )}
    </>
  );
});
