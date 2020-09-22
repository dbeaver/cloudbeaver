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
  useFocus,
  ObjectPropertyInfoForm,
  Checkbox,
  Textarea,
  InputGroup,
  RadioGroup,
  TabsState,
  TabPanel,
  Combobox,
  SubmittingForm
} from '@cloudbeaver/core-blocks';
import { useController } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { EConnectionType } from '../EConnectionType';
import { IConnectionFormModel } from '../IConnectionFormModel';
import { formStyles } from './formStyles';
import { OptionsController } from './OptionsController';
import { ParametersForm } from './ParametersForm';

type Props = {
  model: IConnectionFormModel;
  type: EConnectionType;
  saving?: boolean;
  disabled?: boolean;
  onTypeChange(type: EConnectionType): void;
  onSave?(): void;
}

const styles = css`
  SubmittingForm {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
  }
  box-element {
    min-width: 450px;
  }
  TabPanel {
    flex-direction: column;
  }
`;

export const Options = observer(function Options({
  model,
  type,
  disabled,
  saving,
  onTypeChange,
  onSave,
}: Props) {
  const controller = useController(OptionsController, model);
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLFormElement>({ focusFirstChild: true });

  return styled(useStyles(styles, formStyles))(
    <SubmittingForm ref={focusedRef} onChange={controller.onFormChange} onSubmit={onSave}>
      <box as="div">
        <box-element as='div'>
          <group as="div">
            <Checkbox
              name="template"
              value={model.connection.id}
              state={model.connection}
              checkboxLabel={translate('connections_connection_template')}
              disabled={model.editing || disabled}
              mod='surface'
            />
          </group>
          <group as="div">
            <Combobox
              name='driverId'
              state={model.connection}
              items={controller.drivers}
              keySelector={driver => driver.id}
              valueSelector={driver => driver?.name ?? ''}
              onSelect={controller.onSelectDriver}
              readOnly={model.editing || controller.drivers.length < 2}
              mod={'surface'}
              disabled={disabled}
            >
              {translate('connections_connection_driver')}
            </Combobox>
          </group>
          <group as="div">
            <InputField
              type="text"
              name="name"
              state={model.connection}
              disabled={disabled}
              mod='surface'
            >
              {translate('connections_connection_name')}
            </InputField>
          </group>
          <group as="div">
            <Textarea
              name="description"
              rows={3}
              state={model.connection}
              disabled={disabled}
              mod='surface'
            >
              {translate('connections_connection_description')}
            </Textarea>
          </group>
        </box-element>
        <box-element as='div'>
          <connection-type as="div">
            <RadioGroup name='type' value={type} onChange={onTypeChange}>
              <Radio value={EConnectionType.Parameters} disabled={disabled} mod={['primary']}>
                {translate('customConnection_connectionType_custom')}
              </Radio>
              <Radio value={EConnectionType.URL} disabled={disabled} mod={['primary']}>
                {translate('customConnection_connectionType_url')}
              </Radio>
            </RadioGroup>
          </connection-type>
          <TabsState currentTabId={type}>
            <TabPanel tabId={EConnectionType.Parameters}>
              <ParametersForm
                connection={model.connection}
                embedded={controller.driver?.embedded}
                disabled={disabled || saving}
              />
            </TabPanel>
            <TabPanel tabId={EConnectionType.URL}>
              <group as="div">
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
              </group>
            </TabPanel>
          </TabsState>
          {(controller.authModel && !controller.driver?.anonymousAccess) && (
            <>
              <group as="div">
                <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
              </group>
              <ObjectPropertyInfoForm
                autofillToken='new-password'
                properties={controller.authModel.properties}
                credentials={model.credentials}
                disabled={disabled}
              />
            </>
          )}
        </box-element>
      </box>
    </SubmittingForm>
  );
});
