/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import {
  InputField,
  ObjectPropertyInfoForm,
  Textarea,
  InputGroup,
  Combobox,
  SubmittingForm, FieldCheckbox, FormBox, FormBoxElement, FormGroup, TabContainerTabComponent, useMapResource
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { DatabaseAuthModelsResource } from '../../../../DatabaseAuthModelsResource';
import { DBDriverResource } from '../../../../DBDriverResource';
import { isJDBCConnection } from '../../../ConnectionsResource';
import type { IConnectionFormProps } from '../ConnectionFormService';
import { ParametersForm } from './ParametersForm';
import { useOptions } from './useOptions';

const styles = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
    padding-top: 16px;
  }
  parameters-type-container {
    max-width: 630px;
  }
`;

export const Options: TabContainerTabComponent<IConnectionFormProps> = observer(function Options(props) {
  const {
    data,
    form,
    options,
  } = props;
  const translate = useTranslate();
  const { setDefaults, updateNameTemplate } = useOptions(props);
  const driver = useMapResource(
    DBDriverResource,
    data.config.driverId || null,
    {
      onLoad: async resource => {
        resource.loadAll();

        if (!data.config.driverId && data.info) {
          data.info.authModel = undefined;
        }
      },
      onData: (data, resource, prevData) => setDefaults(data, prevData),
    }
  );

  const handleFormChange = useCallback((value?: unknown, name?: string) => {
    if (name !== 'name') {
      updateNameTemplate(driver.data);
    }
  }, [updateNameTemplate]);

  const { data: authModel } = useMapResource(
    DatabaseAuthModelsResource,
    data.info?.authModel || driver.data?.defaultAuthModel || null
  );

  const JDBC = isJDBCConnection(driver.data, data.info);
  const edit = options.mode === 'edit';
  const drivers = driver.resource.values.filter(({ id }) => data.availableDrivers?.includes(id));
  let properties = authModel?.properties;

  if (data.info && data.info.authProperties.length > 0) {
    properties = data.info.authProperties;
  }

  return styled(useStyles(styles))(
    <SubmittingForm onChange={handleFormChange} onSubmit={form.onSubmit}>
      <FormBox>
        <FormBoxElement>
          <FormGroup>
            <Combobox
              name='driverId'
              state={data.config}
              items={drivers}
              keySelector={driver => driver.id}
              valueSelector={driver => driver?.name ?? ''}
              readOnly={edit || drivers.length < 2}
              mod="surface"
              disabled={form.disabled}
            >
              {translate('connections_connection_driver')}
            </Combobox>
          </FormGroup>
          <FormGroup>
            <InputField
              type="text"
              name="name"
              state={data.config}
              disabled={form.disabled}
              mod='surface'
            >
              {translate('connections_connection_name')}
            </InputField>
          </FormGroup>
          <FormGroup>
            <Textarea
              name="description"
              rows={3}
              state={data.config}
              disabled={form.disabled}
              mod='surface'
            >
              {translate('connections_connection_description')}
            </Textarea>
          </FormGroup>
          {form.originLocal && (
            <FormGroup>
              <FieldCheckbox
                name="template"
                value={data.config.connectionId}
                state={data.config}
                checkboxLabel={translate('connections_connection_template')}
                disabled={edit || form.disabled}
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
                  disabled={form.disabled}
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
                disabled={form.disabled}
                readOnly={!form.originLocal}
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
                credentials={data.config.credentials}
                disabled={form.disabled}
                showRememberTip
              />
              <FormGroup>
                <FieldCheckbox
                  name="saveCredentials"
                  value={data.config.connectionId + 'authNeeded'}
                  state={data.config}
                  checkboxLabel={translate('connections_connection_edit_save_credentials')}
                  disabled={form.disabled}
                  mod='surface'
                />
              </FormGroup>
            </>
          )}
        </FormBoxElement>
      </FormBox>
    </SubmittingForm>
  );
});
