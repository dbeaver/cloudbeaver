/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';
import styled, { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
import { AUTH_PROVIDER_LOCAL_ID } from '@cloudbeaver/core-authentication';
import {
  InputFieldNew,
  SubmittingForm,
  TabContainerPanelComponent,
  useMapResource,
  ColoredContainer,
  BASE_CONTAINERS_STYLES,
  Group,
  GroupTitle,
  FieldCheckboxNew,
  ObjectPropertyInfoFormNew,
  TextareaNew,
  ComboboxNew,
  Container,
  useFormValidator,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { useAuthenticationAction } from '@cloudbeaver/core-ui';

import { isLocalConnection } from '../../Administration/ConnectionsResource';
import { DatabaseAuthModelsResource } from '../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../DBDriverResource';
import { isJDBCConnection } from '../../isJDBCConnection';
import { ConnectionFormService } from '../ConnectionFormService';
import type { IConnectionFormProps } from '../IConnectionFormProps';
import { ParametersFormNew } from './ParametersFormNew';
import { useOptions } from './useOptions';

const styles = css`
  SubmittingForm {
    flex: 1;
    overflow: auto;
  }
`;

export const Options: TabContainerPanelComponent<IConnectionFormProps> = observer(function Options(props) {
  const {
    state,
  } = props;
  const service = useService(ConnectionFormService);
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();
  const {
    info,
    config,
    availableDrivers,
    submittingTask: submittingHandlers,
    save,
    readonly,
    disabled,
  } = state;

  const authentication = useAuthenticationAction({
    origin: state.info?.origin ?? { type: AUTH_PROVIDER_LOCAL_ID, displayName: 'Local' },
  });

  useFormValidator(submittingHandlers.for(service.formValidationTask), formRef);
  const optionsHook = useOptions(props.state);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const driver = useMapResource(
    DBDriverResource,
    { key: config.driverId || null, includes: ['includeProviderProperties'] },
    {
      onData: (data, resource, prevData) => optionsHook.setDefaults(data, prevData),
    }
  );

  const handleFormChange = useCallback((value?: unknown, name?: string) => {
    if (name !== 'name') {
      optionsHook.updateNameTemplate(driver.data);
    }
  }, []);

  const { data: authModel } = useMapResource(
    DatabaseAuthModelsResource,
    info?.authModel || driver.data?.defaultAuthModel || null,
    {
      onData: data => optionsHook.setAuthModel(data),
    }
  );

  const JDBC = isJDBCConnection(driver.data, info);
  const admin = state.type === 'admin';
  const edit = state.mode === 'edit';
  const originLocal = !info || isLocalConnection(info);

  const drivers = driver.resource.values.filter(({ id }) => availableDrivers?.includes(id));
  let properties = authModel?.properties;

  if (info?.authProperties && info.authProperties.length > 0) {
    properties = info.authProperties;
  }

  // TODO we need to get these values other way
  const providerPropertiesWithoutBoolean = driver.data?.providerProperties?.slice().filter(property => property.dataType !== 'Boolean');
  const booleanProviderProperties = driver.data?.providerProperties?.slice().filter(property => property.dataType === 'Boolean');

  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <SubmittingForm ref={formRef} onChange={handleFormChange} onSubmit={save}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <Container wrap gap>
              <ComboboxNew
                name='driverId'
                state={config}
                items={drivers}
                keySelector={driver => driver.id}
                valueSelector={driver => driver?.name ?? ''}
                readOnly={readonly || edit || drivers.length < 2}
                disabled={disabled}
                tiny
                fill
              >
                {translate('connections_connection_driver')}
              </ComboboxNew>
              <InputFieldNew
                type="text"
                name="name"
                minLength={1}
                state={config}
                disabled={disabled}
                readOnly={readonly}
                mod='surface'
                required
                tiny
                fill
              >
                {translate('connections_connection_name')}
              </InputFieldNew>
            </Container>
            {JDBC ? (
              <InputFieldNew
                type="text"
                name="url"
                state={config}
                disabled={disabled}
                readOnly={readonly}
                autoComplete={`section-${config.driverId || 'driver'} section-jdbc`}
                mod='surface'
              >
                {translate('customConnection_url_JDBC')}
              </InputFieldNew>
            ) : (
              <ParametersFormNew
                config={config}
                embedded={driver.data?.embedded}
                disabled={disabled}
                readOnly={readonly}
                originLocal={originLocal}
              />
            )}
            {admin && originLocal && (
              <FieldCheckboxNew
                id={config.connectionId}
                name="template"
                state={config}
                disabled={edit || disabled}
                readOnly={readonly}
                // autoHide={} // maybe better to use autoHide
              >
                {translate('connections_connection_template')}
              </FieldCheckboxNew>
            )}
            <TextareaNew
              name="description"
              rows={3}
              state={config}
              disabled={disabled}
              readOnly={readonly}
            >
              {translate('connections_connection_description')}
            </TextareaNew>
          </Group>
        </Container>
        <Container medium gap>
          {(authModel && !driver.data?.anonymousAccess && properties && authentication.authorized) && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_authentication')}</GroupTitle>
              <Container wrap gap>
                <ObjectPropertyInfoFormNew
                  autofillToken='new-password'
                  properties={properties}
                  state={config.credentials}
                  disabled={disabled}
                  readOnly={readonly}
                  showRememberTip
                  tiny
                />
              </Container>
              {credentialsSavingEnabled && (
                <FieldCheckboxNew
                  id={config.connectionId + 'authNeeded'}
                  name="saveCredentials"
                  state={config}
                  disabled={disabled || readonly}
                >{translate('connections_connection_edit_save_credentials')}
                </FieldCheckboxNew>
              )}
            </Group>
          )}
          {driver.isLoaded() && driver.data?.providerProperties && driver.data.providerProperties.length > 0 && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_settings')}</GroupTitle>
              {booleanProviderProperties && booleanProviderProperties.length > 0 && (
                <Container gap wrap>
                  <ObjectPropertyInfoFormNew
                    properties={booleanProviderProperties}
                    state={config.providerProperties}
                    disabled={disabled}
                    readOnly={readonly}
                    keepSize
                  />
                </Container>
              )}
              {providerPropertiesWithoutBoolean && (
                <Container wrap gap>
                  <ObjectPropertyInfoFormNew
                    properties={providerPropertiesWithoutBoolean}
                    state={config.providerProperties}
                    disabled={disabled}
                    readOnly={readonly}
                    tiny
                  />
                </Container>
              )}
            </Group>
          )}
        </Container>
      </ColoredContainer>
    </SubmittingForm>
  );
});
