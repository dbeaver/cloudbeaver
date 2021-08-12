/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Container, FieldCheckboxNew, Group, GroupTitle, ObjectPropertyInfoFormNew, TextPlaceholder, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { UserConnectionAuthPropertiesFragment } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { DatabaseAuthModelsResource } from '../DatabaseAuthModelsResource';
import type { IConnectionAuthenticationConfig } from './IConnectionAuthenticationConfig';
import { NetworkHandlers } from './NetworkHandlers';

interface Props {
  config: Partial<IConnectionAuthenticationConfig>;
  authModelId: string | null;
  authProperties?: UserConnectionAuthPropertiesFragment[];
  networkHandlers?: string[];
  formId?: string;
  allowSaveCredentials?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ConnectionAuthenticationForm: React.FC<Props> = observer(function ConnectionAuthenticationForm({
  config, networkHandlers, authProperties, authModelId, formId, allowSaveCredentials, disabled, className,
}) {
  const translate = useTranslate();
  const { data: authModel } = useMapResource(DatabaseAuthModelsResource, authModelId);

  let properties = authModel?.properties;

  if (authProperties) {
    properties = authProperties;
  }

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Container className={className}>
      {authModelId && (
        <Group gap small>
          {properties ? (
            <>
              {!!networkHandlers?.length && <GroupTitle>{translate('connections_database_authentication')}</GroupTitle>}
              <ObjectPropertyInfoFormNew
                autofillToken={`section-${formId || ''} section-auth`}
                properties={properties}
                state={config.credentials}
                disabled={disabled}
              />
              {allowSaveCredentials && (
                <FieldCheckboxNew
                  id={formId || 'DBAuthSaveCredentials'}
                  name="saveCredentials"
                  label={translate('connections_connection_edit_save_credentials')}
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
          networkHandlers={networkHandlers}
          networkHandlersConfig={config.networkHandlersConfig}
          allowSaveCredentials={allowSaveCredentials}
          disabled={disabled}
        />
      )}
    </Container>
  );
});
