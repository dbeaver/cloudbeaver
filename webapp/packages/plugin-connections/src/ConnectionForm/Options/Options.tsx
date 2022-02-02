/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
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
  InputField,
  SubmittingForm,
  useMapResource,
  ColoredContainer,
  BASE_CONTAINERS_STYLES,
  Group,
  GroupTitle,
  FieldCheckbox,
  ObjectPropertyInfoForm,
  Textarea,
  Combobox,
  Container,
  useFormValidator,
} from '@cloudbeaver/core-blocks';
import { DatabaseAuthModelsResource, DBDriverResource, isJDBCConnection, isLocalConnection } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';
import { useAuthenticationAction } from '@cloudbeaver/core-ui';

import { ConnectionFormService } from '../ConnectionFormService';
import type { IConnectionFormProps } from '../IConnectionFormProps';
import { ParametersForm } from './ParametersForm';
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
    readonly,
    disabled,
  } = state;

  const authentication = useAuthenticationAction({
    origin: state.info?.origin ?? { type: AUTH_PROVIDER_LOCAL_ID, displayName: 'Local' },
  });

  useFormValidator(submittingHandlers.for(service.formValidationTask), formRef.current);
  const optionsHook = useOptions(props.state);
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const handleDriverSelect = useCallback(async (value?: string, name?: string, prev?: string) => {
    if (!value) {
      return;
    }

    const prevDriver = prev ? await driver.resource.load(prev) : undefined;
    const newDriver = await driver.resource.load(value);

    optionsHook.setDefaults(newDriver, prevDriver);
  }, []);

  const driver = useMapResource(
    Options,
    DBDriverResource,
    { key: config.driverId || null, includes: ['includeProviderProperties'] },
    {
      onData: (data, resource, prevData) => {
        if (!prevData) {
          handleDriverSelect(data.id);
        }
      },
    }
  );

  const handleFormChange = useCallback((value?: unknown, name?: string) => {
    if (name !== 'name') {
      optionsHook.updateNameTemplate(driver.data);
    }
  }, []);

  const { data: authModel } = useMapResource(
    Options,
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

  const drivers = driver.resource.values
    .filter(({ id }) => availableDrivers.includes(id))
    .sort(driver.resource.compare);

  let properties = authModel?.properties;

  if (info?.authProperties && info.authProperties.length > 0) {
    properties = info.authProperties;
  }

  // TODO we need to get these values other way
  const providerPropertiesWithoutBoolean = driver.data?.providerProperties.slice().filter(property => property.dataType !== 'Boolean');
  const booleanProviderProperties = driver.data?.providerProperties.slice().filter(property => property.dataType === 'Boolean');

  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <SubmittingForm ref={formRef} onChange={handleFormChange}>
      <ColoredContainer wrap overflow parent gap>
        <Container medium gap>
          <Group form gap>
            <Container wrap gap>
              <Combobox
                name='driverId'
                state={config}
                items={drivers}
                keySelector={driver => driver.id}
                valueSelector={driver => driver.name ?? ''}
                titleSelector={driver => driver.description}
                iconSelector={driver => driver.icon}
                searchable={drivers.length > 10}
                readOnly={readonly || edit || drivers.length < 2}
                disabled={disabled}
                tiny
                fill
                onSelect={handleDriverSelect}
              >
                {translate('connections_connection_driver')}
              </Combobox>
              <InputField
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
              </InputField>
            </Container>
            {JDBC ? (
              <InputField
                type="text"
                name="url"
                state={config}
                disabled={disabled}
                readOnly={readonly}
                autoComplete={`section-${config.driverId || 'driver'} section-jdbc`}
                mod='surface'
              >
                {translate('customConnection_url_JDBC')}
              </InputField>
            ) : (
              <ParametersForm
                config={config}
                embedded={driver.data?.embedded}
                disabled={disabled}
                readOnly={readonly}
                originLocal={originLocal}
              />
            )}
            {admin && originLocal && (
              <FieldCheckbox
                id={config.connectionId}
                name="template"
                state={config}
                disabled={edit || disabled}
                readOnly={readonly}
                // autoHide // maybe better to use autoHide
              >
                {translate('connections_connection_template')}
              </FieldCheckbox>
            )}
            <Textarea
              name="description"
              rows={3}
              state={config}
              disabled={disabled}
              readOnly={readonly}
            >
              {translate('connections_connection_description')}
            </Textarea>
          </Group>
        </Container>
        <Container medium gap>
          {(authModel && !driver.data?.anonymousAccess && properties && authentication.authorized) && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_authentication')}</GroupTitle>
              <Container wrap gap>
                <ObjectPropertyInfoForm
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
                <FieldCheckbox
                  id={config.connectionId + 'authNeeded'}
                  name="saveCredentials"
                  state={config}
                  disabled={disabled || readonly}
                >{translate('connections_connection_edit_save_credentials')}
                </FieldCheckbox>
              )}
            </Group>
          )}
          {driver.isLoaded() && driver.data?.providerProperties && driver.data.providerProperties.length > 0 && (
            <Group form gap>
              <GroupTitle>{translate('connections_connection_edit_settings')}</GroupTitle>
              {booleanProviderProperties && booleanProviderProperties.length > 0 && (
                <Container gap wrap>
                  <ObjectPropertyInfoForm
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
                  <ObjectPropertyInfoForm
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
