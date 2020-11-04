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
  Radio,
  InputField,
  ObjectPropertyInfoForm,
  Textarea,
  InputGroup,
  RadioGroup,
  TabsState,
  TabPanel,
  Combobox,
  SubmittingForm, FieldCheckbox, FormBox, FormBoxElement, FormGroup
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionFormController } from '../ConnectionFormController';
import { EConnectionType } from '../EConnectionType';
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
  TabPanel {
    flex-direction: column;
    max-width: 630px;
  }
  connection-type {
    margin-left: 180px;
  }
  Radio {
    composes: theme-typography--body2 from global;
  }
`;

export const Options = observer(function Options({
  model,
  controller: formController,
}: Props) {
  const controller = useController(OptionsController, model);
  const translate = useTranslate();
  const disabled = formController.isDisabled;

  return styled(useStyles(styles))(
    <SubmittingForm onChange={controller.onFormChange} onSubmit={formController.save}>
      <FormBox>
        <FormBoxElement>
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
        </FormBoxElement>
        <FormBoxElement>
          <connection-type as="div">
            <RadioGroup name='type' value={formController.connectionType} onChange={formController.setType}>
              <Radio value={EConnectionType.Parameters} disabled={disabled} mod={['primary']}>
                {translate('customConnection_connectionType_custom')}
              </Radio>
              <Radio value={EConnectionType.URL} disabled={disabled} mod={['primary']}>
                {translate('customConnection_connectionType_url')}
              </Radio>
            </RadioGroup>
          </connection-type>
          <TabsState currentTabId={formController.connectionType}>
            <TabPanel tabId={EConnectionType.Parameters}>
              <ParametersForm
                connection={model.connection}
                embedded={controller.driver?.embedded}
                disabled={disabled}
              />
            </TabPanel>
            <TabPanel tabId={EConnectionType.URL}>
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
            </TabPanel>
          </TabsState>
          {(controller.authModel && !controller.driver?.anonymousAccess) && (
            <>
              <FormGroup>
                <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
              </FormGroup>
              <ObjectPropertyInfoForm
                autofillToken='new-password'
                properties={controller.authModel.properties}
                credentials={model.credentials}
                disabled={disabled}
                onFocus={controller.resetPassword}
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
