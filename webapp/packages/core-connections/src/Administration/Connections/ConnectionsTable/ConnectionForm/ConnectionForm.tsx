/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use } from 'reshadow';

import {
  Radio, InputField, useFocus, ObjectPropertyInfoForm, Combobox, Checkbox, Textarea, InputGroup
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionType } from '../ConnectionEditController';
import { formStyles } from './formStyles';
import { IFormController } from './IFormController';
import { ParametersForm } from './ParametersForm';

type ConnectionFormProps = {
  controller: IFormController;
}

export const ConnectionForm = observer(function ConnectionForm({
  controller,
}: ConnectionFormProps) {
  const translate = useTranslate();
  const [focusedRef] = useFocus({ focusFirstChild: true });

  return styled(useStyles(formStyles))(
    <connection-form as='div' ref={focusedRef as React.RefObject<HTMLDivElement>}>
      <layout-grid as="div">
        <layout-grid-inner as="div">
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 5 })}>
            <group as="div">
              <Checkbox
                name="template"
                value={controller.connectionId}
                checkboxLabel={translate('connections_connection_template')}
                checked={controller.config.template}
                onChange={value => controller.onChange('template', value)}
                disabled={controller.isSaving}
                mod='surface'
              />
            </group>
            <group as="div">
              <Combobox
                value={controller.driver?.id}
                items={controller.drivers}
                keySelector={driver => driver.id}
                valueSelector={driver => driver?.name!}
                onSelect={controller.onSelectDriver}
                readOnly={!controller.isNew}
                mod={'surface'}
              >
                {translate('connections_connection_driver')}
              </Combobox>
            </group>
            <group as="div">
              <InputField
                type="text"
                name="name"
                value={controller.config.name}
                onChange={value => controller.onChange('name', value)}
                disabled={controller.isSaving}
                mod='surface'
              >
                {translate('connections_connection_name')}
              </InputField>
            </group>
            <group as="div">
              <Textarea
                name="description"
                rows={3}
                value={controller.config.description}
                onChange={value => controller.onChange('description', value)}
                disabled={controller.isSaving}
                mod='surface'
              >
                {translate('connections_connection_description')}
              </Textarea>
            </group>
          </layout-grid-cell>
          <layout-grid-cell as='div' {...use({ 'span-tablet': '12', 'span-desktop': 7 })}>
            <connection-type as="div">
              <Radio
                name="type"
                id={`${controller.connectionId}custom`}
                value={'custom'}
                onClick={() => controller.onChangeType(ConnectionType.Attributes)}
                checked={controller.connectionType === ConnectionType.Attributes}
                disabled={controller.isSaving}
                mod={['primary']}
              >
                {translate('customConnection_connectionType_custom')}
              </Radio>
              <Radio
                name="type"
                id={`${controller.connectionId}url`}
                value={'url'}
                onClick={() => controller.onChangeType(ConnectionType.URL)}
                checked={controller.connectionType === ConnectionType.URL}
                disabled={controller.isSaving}
                mod={['primary']}
              >
                {translate('customConnection_connectionType_url')}
              </Radio>
            </connection-type>
            {controller.connectionType === ConnectionType.Attributes ? (
              <ParametersForm controller={controller} embedded={controller.driver?.embedded} />
            ) : (
              <group as="div">
                <InputField
                  type="text"
                  name="url"
                  value={controller.config.url}
                  onChange={value => controller.onChange('url', value)}
                  disabled={controller.isSaving}
                  mod='surface'
                >
                  {translate('customConnection_url_JDBC')}
                </InputField>
              </group>
            )}
            {controller.authModel && (
              <>
                <group as="div">
                  <InputGroup>{translate('connections_connection_edit_authentication')}</InputGroup>
                </group>
                <ObjectPropertyInfoForm
                  prefix={`auth_${controller.driver?.id || ''}`}
                  autofillToken={`section-${controller.driver?.id || ''} section-auth`}
                  properties={controller.authModel.properties}
                  credentials={controller.config.credentials}
                  processing={controller.isSaving}
                />
              </>
            )}
          </layout-grid-cell>
        </layout-grid-inner>
      </layout-grid>
    </connection-form>
  );
});
