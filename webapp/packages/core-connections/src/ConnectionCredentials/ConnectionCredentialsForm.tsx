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
import { useStyles } from '@cloudbeaver/core-theming';

import { DatabaseAuthModelsResource } from '../DatabaseAuthModelsResource';
import type { IConnectionAuthCredentialsConfig } from './IConnectionAuthCredentialsConfig';
import { NetworkHandlers } from './NetworkHandlers';

interface Props {
  config: Partial<IConnectionAuthCredentialsConfig>;
  authModelId: string | null;
  networkHandlers?: string[];
  formId?: string;
  allowSaveCredentials?: boolean;
  disabled?: boolean;
  className?: string;
}

export const ConnectionCredentialsForm: React.FC<Props> = observer(function ConnectionCredentialsForm({
  config, networkHandlers, authModelId, formId, allowSaveCredentials, disabled, className,
}) {
  const translate = useTranslate();
  const { data: authModel } = useMapResource(DatabaseAuthModelsResource, authModelId);

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Container className={className}>
      {authModel && (
        <Group gap small>
          {authModel.properties ? (
            <>
              {!!networkHandlers?.length && <GroupTitle>{translate('connections_database_authentication')}</GroupTitle>}
              <ObjectPropertyInfoFormNew
                autofillToken={`section-${formId || ''} section-auth`}
                properties={authModel.properties}
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
