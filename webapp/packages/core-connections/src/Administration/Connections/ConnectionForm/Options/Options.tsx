/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import {
  InputField,
  ObjectPropertyInfoForm,
  Textarea,
  InputGroup,
  Combobox,
  SubmittingForm, FieldCheckbox, FormBox, FormBoxElement, FormGroup
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionFormController } from '../ConnectionFormController';
import { IConnectionFormModel } from '../IConnectionFormModel';
import { OptionsController } from './OptionsController';
import { ParametersForm } from './ParametersForm';

interface Props {
  tabId: string;
  model: IConnectionFormModel;
  controller: ConnectionFormController;
}

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

export const Options = observer(function Options({
  model,
  controller: formController,
}: Props) {
  const controller = useController(OptionsController, model);
  const translate = useTranslate();
  const disabled = formController.isDisabled;
  const isOriginLocal = formController.local;

  return styled(useStyles(styles))(
    <SubmittingForm onChange={controller.onFormChange} onSubmit={formController.save}>
      <FormBox>
        <FormBoxElement>
          <FormGroup>
            <Combobox
              name='driverId'
              state={model.connection}
              items={controller.drivers}
              keySelector={driver => driver.id}
              valueSelector={driver => driver?.name ?? ''}
              readOnly={model.editing || controller.drivers.length < 2}
              mod="surface"
              disabled={disabled}
              onSelect={controller.onSelectDriver}
            >
              {translate('connections_connection_driver')}
            </Combobox>
          </FormGroup>
          <FormGroup>
            <InputField
              type="text"
              name="name"
              state={model.connection}
              disabled={disabled}
              mod='surface'
            >
              {translate('connections_connection_name')}
            </InputField>
          </FormGroup>
          <FormGroup>
            <Textarea
              name="description"
              rows={3}
              state={model.connection}
              disabled={disabled}
              mod='surface'
            >
              {translate('connections_connection_description')}
            </Textarea>
          </FormGroup>
          {isOriginLocal && (
            <FormGroup>
              <FieldCheckbox
                name="template"
                value={model.connection.id}
                state={model.connection}
                checkboxLabel={translate('connections_connection_template')}
                disabled={model.editing || disabled}
                mod='surface'
              />
            </FormGroup>
          )}
        </FormBoxElement>
        <FormBoxElement>
          <parameters-type-container as='div'>
            {formController.isUrlConnection ? (
              <FormGroup>
                <InputField
                  type="text"
                  name="url"
                  state={model.connection}
                  disabled={disabled}
                  autoComplete={`section-${controller.driver?.id || 'driver'} section-jdbc`}
                  mod='surface'
                >
                  {translate('customConnection_url_JDBC')}
                </InputField>
              </FormGroup>
            ) : (
              <ParametersForm
                connection={model.connection}
                embedded={controller.driver?.embedded}
                disabled={disabled}
                readOnly={!isOriginLocal}
              />
            )}
          </parameters-type-container>

          {(controller.authModel && !controller.driver?.anonymousAccess) && (
            <>
              <FormGroup>
                <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
              </FormGroup>
              <ObjectPropertyInfoForm
                autofillToken='new-password'
                properties={controller.properties}
                credentials={model.credentials}
                disabled={disabled}
              />
              <FormGroup>
                <FieldCheckbox
                  name="saveCredentials"
                  value={model.connection.id + 'authNeeded'}
                  state={model.connection}
                  checkboxLabel={translate('connections_connection_edit_save_credentials')}
                  disabled={disabled}
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
