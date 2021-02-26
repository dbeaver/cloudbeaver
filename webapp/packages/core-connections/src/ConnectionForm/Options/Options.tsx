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
import {
  InputField,
  ObjectPropertyInfoForm,
  Textarea,
  InputGroup,
  Combobox,
  SubmittingForm, FieldCheckbox, FormBox, FormBoxElement, FormGroup, TabContainerPanelComponent, useMapResource
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useFormValidator } from '@cloudbeaver/core-executor';
import { useTranslate } from '@cloudbeaver/core-localization';
import { resourceKeyList } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { DatabaseAuthModelsResource } from '../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../DBDriverResource';
import { isJDBCConnection } from '../../isJDBCConnection';
import { IConnectionFormTabProps, ConnectionFormService } from '../ConnectionFormService';
import { useConnectionData } from '../useConnectionData';
import { ParametersForm } from './ParametersForm';
import { useOptions } from './useOptions';

const styles = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding-top: 16px;
    padding-bottom: 16px;
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
  useConnectionData(data, data => {
    if (!data.config.credentials) {
      data.config.credentials = {};
    }

    if (!data.config.providerProperties) {
      data.config.providerProperties = {};
    }

    if (!data.availableDrivers) {
      data.availableDrivers = data.config.driverId ? [data.config.driverId] : [];
    }

    if (!data.info) {
      return;
    }

    data.config.connectionId = data.info.id;

    data.config.name = data.info.name.trim();
    data.config.description = data.info.description;
    data.config.template = data.info.template;
    data.config.driverId = data.info.driverId;

    if (data.availableDrivers.length === 0) {
      data.availableDrivers = [data.info.driverId];
    }

    data.config.host = data.info.host;
    data.config.port = data.info.port;
    data.config.databaseName = data.info.databaseName;
    data.config.url = data.info.url;

    data.config.authModelId = data.info.authModel;
    data.config.saveCredentials = data.info.saveCredentials;

    for (const property of data.info.authProperties) {
      if (!property.features.includes('password')) {
        data.config.credentials[property.id!] = property.value;
      }
    }

    data.config.providerProperties = { ...data.info.providerProperties };
  });
  const optionsHook = useOptions({ data, form: form.form, options });
  const { credentialsSavingEnabled } = useAdministrationSettings();

  const driver = useMapResource(
    DBDriverResource,
    { key: data.config.driverId || null, includes: ['includeProviderProperties'] },
    {
      onLoad: async resource => {
        if (data.availableDrivers && data.availableDrivers.length > 1) {
          await resource.load(resourceKeyList(data.availableDrivers), ['includeProviderProperties']);
        }

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

  return styled(useStyles(styles))(
    <SubmittingForm ref={formRef} onChange={handleFormChange} onSubmit={form.save}>
      <FormBox>
        <FormBoxElement>
          {(admin || edit) && (
            <FormGroup>
              <Combobox
                name='driverId'
                state={data.config}
                items={drivers}
                keySelector={driver => driver.id}
                valueSelector={driver => driver?.name ?? ''}
                readOnly={form.form.readonly || edit || drivers.length < 2}
                mod="surface"
                disabled={form.form.disabled}
              >
                {translate('connections_connection_driver')}
              </Combobox>
            </FormGroup>
          )}
          <FormGroup>
            <InputField
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
            </InputField>
          </FormGroup>
          <FormGroup>
            <Textarea
              name="description"
              rows={3}
              state={data.config}
              disabled={form.form.disabled}
              readOnly={form.form.readonly}
              mod='surface'
            >
              {translate('connections_connection_description')}
            </Textarea>
          </FormGroup>
          {admin && form.form.originLocal && (
            <FormGroup>
              <FieldCheckbox
                name="template"
                value={data.config.connectionId}
                state={data.config}
                checkboxLabel={translate('connections_connection_template')}
                disabled={edit || form.form.disabled}
                readOnly={form.form.readonly}
                // autoHide={} // maybe better to use autoHide
                mod='surface'
              />
            </FormGroup>
          )}
        </FormBoxElement>
        <FormBoxElement>
          <parameters-type-container as='div'>
            {JDBC ? (
              <FormGroup>
                <InputField
                  type="text"
                  name="url"
                  state={data.config}
                  disabled={form.form.disabled}
                  readOnly={form.form.readonly}
                  autoComplete={`section-${data.config.driverId || 'driver'} section-jdbc`}
                  mod='surface'
                >
                  {translate('customConnection_url_JDBC')}
                </InputField>
              </FormGroup>
            ) : (
              <ParametersForm
                config={data.config}
                embedded={driver.data?.embedded}
                disabled={form.form.disabled}
                readOnly={form.form.readonly || !form.form.originLocal}
              />
            )}
          </parameters-type-container>

          {(authModel && !driver.data?.anonymousAccess) && (
            <>
              <FormGroup>
                <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
              </FormGroup>
              <ObjectPropertyInfoForm
                autofillToken='new-password'
                properties={properties}
                state={data.config.credentials}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
                showRememberTip
              />
              {credentialsSavingEnabled && (
                <FormGroup>
                  <FieldCheckbox
                    name="saveCredentials"
                    value={data.config.connectionId + 'authNeeded'}
                    state={data.config}
                    checkboxLabel={translate('connections_connection_edit_save_credentials')}
                    disabled={form.form.disabled}
                    readOnly={form.form.readonly}
                    mod='surface'
                  />
                </FormGroup>
              )}
            </>
          )}
        </FormBoxElement>
        <FormBoxElement>
          {driver.isLoaded() && driver.data && driver.data.providerProperties.length > 0 && (
            <>
              <FormGroup>
                <InputGroup>{translate('connections_connection_edit_settings')}</InputGroup>
              </FormGroup>
              <ObjectPropertyInfoForm
                properties={driver.data.providerProperties}
                state={data.config.providerProperties}
                disabled={form.form.disabled}
                readOnly={form.form.readonly}
              />
            </>
          )}
        </FormBoxElement>
      </FormBox>
    </SubmittingForm>
  );
});
