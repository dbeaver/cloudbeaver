/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Container,
  FieldCheckbox,
  Group,
  GroupTitle,
  ObjectPropertyInfoForm,
  TextPlaceholder,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { DatabaseAuthModelsResource } from '@cloudbeaver/core-connections';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { IConnectionAuthenticationConfig } from './IConnectionAuthenticationConfig';
import { NetworkHandlers } from './NetworkHandlers';

export interface ConnectionAuthenticationFormProps {
  config: Partial<IConnectionAuthenticationConfig>;
  authModelId: string | null;
  authProperties?: ObjectPropertyInfo[];
  networkHandlers?: string[];
  formId?: string;
  allowSaveCredentials?: boolean;
  distributed: boolean;
  disabled?: boolean;
  className?: string;
  hideFeatures?: string[];
}

export const ConnectionAuthenticationForm = observer<ConnectionAuthenticationFormProps>(function ConnectionAuthenticationForm({
  config,
  networkHandlers,
  authProperties,
  authModelId,
  formId,
  allowSaveCredentials,
  disabled,
  className,
  distributed,
  hideFeatures,
}) {
  const translate = useTranslate();
  const authModel = useResource(ConnectionAuthenticationForm, DatabaseAuthModelsResource, authModelId);

  let properties = authModel.data?.properties;

  if (authProperties) {
    properties = authProperties;
  }

  if (properties && hideFeatures?.length) {
    properties = properties.filter(property => !property.features.some(feature => hideFeatures.includes(feature)));
  }

  return (
    <Container className={className}>
      {authModelId && (
        <Group gap small>
          {properties ? (
            <>
              {!!networkHandlers?.length && <GroupTitle>{translate('connections_database_authentication')}</GroupTitle>}
              <ObjectPropertyInfoForm
                autofillToken={`section-${formId || ''} section-auth`}
                properties={properties}
                state={config.credentials}
                disabled={disabled}
                canShowPassword={false}
              />
              {allowSaveCredentials && (
                <FieldCheckbox
                  id={formId || 'DBAuthSaveCredentials'}
                  name="saveCredentials"
                  label={translate(
                    distributed
                      ? 'connections_connection_authentication_save_credentials_for_user'
                      : 'connections_connection_authentication_save_credentials_for_session',
                  )}
                  title={translate(
                    distributed
                      ? 'connections_connection_authentication_save_credentials_for_user_tooltip'
                      : 'connections_connection_authentication_save_credentials_for_session_tooltip',
                  )}
                  disabled={disabled}
                  state={config}
                />
              )}
            </>
          ) : (
            <TextPlaceholder>Authentication data is not avaliable</TextPlaceholder>
          )}
        </Group>
      )}
      {networkHandlers && config.networkHandlersConfig && (
        <NetworkHandlers
          distributed={distributed}
          networkHandlers={networkHandlers}
          networkHandlersConfig={config.networkHandlersConfig}
          allowSaveCredentials={allowSaveCredentials}
          disabled={disabled}
        />
      )}
    </Container>
  );
});
