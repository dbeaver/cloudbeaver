/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useRef } from 'react';
import styled, { css } from 'reshadow';

import { useAdministrationSettings } from '@cloudbeaver/core-administration';
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
  Grid
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useFormValidator } from '@cloudbeaver/core-executor';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { DatabaseAuthModelsResource } from '../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../DBDriverResource';
import { isJDBCConnection } from '../../isJDBCConnection';
import { IConnectionFormTabProps, ConnectionFormService } from '../ConnectionFormService';
import { useConnectionData } from '../useConnectionData';
import { ParametersFormNew } from './ParametersFormNew';
import { useOptions } from './useOptions';

const styles = css`
  SubmittingForm {
    flex: 1;
    overflow: auto;
  }
`;

export const Options: TabContainerPanelComponent<IConnectionFormTabProps> = observer(function Options(props) {
  const {
    data,
    form,
    options,
  } = props;
  const service = useService(ConnectionFormService);
  const formRef = useRef<HTMLFormElement>(null);
  const translate = useTranslate();

  useFormValidator(form.submittingHandlers.for(service.formValidationTask), formRef);
  useConnectionData(data, action((data, update) => {
    if (!data.config.credentials || update) {
      data.config.credentials = {};
      data.config.saveCredentials = false;
    }

    if (!data.config.providerProperties || update) {
      data.config.providerProperties = {};
    }

    if ((!data.availableDrivers || data.availableDrivers.length === 0) && data.config.driverId) {
      data.availableDrivers = [data.config.driverId];
    }

    if (!data.info) {
      return;
    }

    data.config.connectionId = data.info.id;

    data.config.name = data.info.name;
    data.config.description = data.info.description;
    data.config.template = data.info.template;
    data.config.driverId = data.info.driverId;

    if (!data.availableDrivers || data.availableDrivers.length === 0) {
      data.availableDrivers = [data.info.driverId];
    }

    data.config.host = data.info.host;
    data.config.port = data.info.port;
    data.config.databaseName = data.info.databaseName;
    data.config.url = data.info.url;

    data.config.authModelId = data.info.authModel;
    data.config.saveCredentials = data.info.saveCredentials;

    if (data.info.authProperties) {
      for (const property of data.info.authProperties) {
        if (!property.features.includes('password')) {
          data.config.credentials[property.id!] = property.value;
        }
      }
    }

    if (data.info.providerProperties) {
      data.config.providerProperties = { ...data.info.providerProperties };
    }
  }));
  const optionsHook = useOptions({ data, form: form.form, options });
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const driver = useMapResource(
    DBDriverResource,
    { key: data.config.driverId || null, includes: ['includeProviderProperties'] },
    {
      onLoad: async () => {
        if (!data.config.driverId && data.info) {
          data.info.authModel = undefined;
        }
      },
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
    data.info?.authModel || driver.data?.defaultAuthModel || null,
    {
      onData: data => optionsHook.setAuthModel(data),
    }
  );

  const JDBC = isJDBCConnection(driver.data, data.info);
  const admin = options.type === 'admin';
  const edit = options.mode === 'edit';

  const drivers = driver.resource.values.filter(({ id }) => data.availableDrivers?.includes(id));
  let properties = authModel?.properties;

  if (data.info && data.info.authProperties.length > 0) {
    properties = data.info.authProperties;
  }

  // TODO we need to get these values other way
  const providerPropertiesWithoutBoolean = driver.data?.providerProperties?.slice().filter(property => property.dataType !== 'Boolean');
  const booleanProviderProperties = driver.data?.providerProperties?.slice().filter(property => property.dataType === 'Boolean');

  return styled(useStyles(styles, BASE_CONTAINERS_STYLES))(
    <SubmittingForm ref={formRef} onChange={handleFormChange} onSubmit={form.save}>
      <ColoredContainer wrap horizontal overflow parent>
        <Container limitWidth>
          <Group form>
            <Grid horizontal>
              <ComboboxNew
                name='driverId'
                state={data.config}
                items={drivers}
                keySelector={driver => driver.id}
                valueSelector={driver => driver?.name ?? ''}
                readOnly={form.form.readonly || edit || drivers.length < 2}
                disabled={form.form.disabled}
              >
                {translate('connections_connection_driver')}
              </ComboboxNew>
              <InputFieldNew
                type="text"
                name="name"
                minLength={1}
                state={data.config}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
                mod='surface'
                required
              >
                {translate('connections_connection_name')}
              </InputFieldNew>
            </Grid>
            {JDBC ? (
              <InputFieldNew
                type="text"
                name="url"
                state={data.config}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
                autoComplete={`section-${data.config.driverId || 'driver'} section-jdbc`}
                mod='surface'
              >
                {translate('customConnection_url_JDBC')}
              </InputFieldNew>
            ) : (
              <ParametersFormNew
                config={data.config}
                embedded={driver.data?.embedded}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
                originLocal={form.form.originLocal}
              />
            )}
            {admin && form.form.originLocal && (
              <FieldCheckboxNew
                name="template"
                value={data.config.connectionId}
                state={data.config}
                disabled={edit || form.form.disabled}
                readOnly={form.form.readonly}
                // autoHide={} // maybe better to use autoHide
              >{translate('connections_connection_template')}
              </FieldCheckboxNew>
            )}
            <TextareaNew
              name="description"
              rows={3}
              state={data.config}
              disabled={form.form.disabled}
              readOnly={form.form.readonly}
            >
              {translate('connections_connection_description')}
            </TextareaNew>
          </Group>
        </Container>
        <Container limitWidth>
          {(authModel && !driver.data?.anonymousAccess) && (
            <Group form horizontal>
              <GroupTitle gridItemMax>{translate('connections_connection_edit_authentication')}</GroupTitle>
              <ObjectPropertyInfoFormNew
                autofillToken='new-password'
                properties={properties}
                state={data.config.credentials}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
                showRememberTip
              />
              {credentialsSavingEnabled && (
                <FieldCheckboxNew
                  name="saveCredentials"
                  value={data.config.connectionId + 'authNeeded'}
                  state={data.config}
                  disabled={form.form.disabled || form.form.readonly}
                  gridItemMax
                >{translate('connections_connection_edit_save_credentials')}
                </FieldCheckboxNew>
              )}
            </Group>
          )}
          {driver.isLoaded() && driver.data?.providerProperties && driver.data.providerProperties.length > 0 && (
            <Group form>
              <GroupTitle>{translate('connections_connection_edit_settings')}</GroupTitle>
              {booleanProviderProperties && booleanProviderProperties.length > 0 && (
                <Container horizontal gridItemMax gap wrap>
                  <ObjectPropertyInfoFormNew
                    properties={booleanProviderProperties}
                    state={data.config.providerProperties}
                    disabled={form.form.disabled}
                    readOnly={form.form.readonly}
                  />
                </Container>
              )}
              {providerPropertiesWithoutBoolean && (
                <Grid horizontal small>
                  <ObjectPropertyInfoFormNew
                    properties={providerPropertiesWithoutBoolean}
                    state={data.config.providerProperties}
                    disabled={form.form.disabled}
                    readOnly={form.form.readonly}
                  />
                </Grid>
              )}
            </Group>
          )}
        </Container>
      </ColoredContainer>
    </SubmittingForm>
  );
});
