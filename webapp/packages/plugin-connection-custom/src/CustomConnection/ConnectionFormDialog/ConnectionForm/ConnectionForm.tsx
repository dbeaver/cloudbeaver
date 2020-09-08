/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled from 'reshadow';

import {
  Radio, InputField, useFocus, ObjectPropertyInfoForm, InputGroup
} from '@cloudbeaver/core-blocks';
import { DBDriver } from '@cloudbeaver/core-connections';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionType } from '../ConnectionFormDialogController';
import { formStyles } from './formStyles';
import { IFormController } from './IFormController';
import { ParametersForm } from './ParametersForm';

type ConnectionFormProps = {
  driver: DBDriver | null;
  controller: IFormController;
}

export const ConnectionForm = observer(function ConnectionForm({
  driver,
  controller,
}: ConnectionFormProps) {
  const translate = useTranslate();
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });

  return styled(useStyles(formStyles))(
    <connection-form as='div'>
      <connection-type as="div" ref={focusedRef}>
        <Radio
          name="type"
          id="custom"
          value="custom"
          onClick={() => controller.onChangeType(ConnectionType.Attributes)}
          checked={controller.connectionType === ConnectionType.Attributes}
          disabled={controller.isConnecting}
          mod={['primary']}
        >
          {translate('customConnection_connectionType_custom')}
        </Radio>
        <Radio
          name="type"
          id="url"
          value="url"
          onClick={() => controller.onChangeType(ConnectionType.URL)}
          checked={controller.connectionType === ConnectionType.URL}
          disabled={controller.isConnecting}
          mod={['primary']}
        >
          {translate('customConnection_connectionType_url')}
        </Radio>
      </connection-type>
      {controller.connectionType === ConnectionType.Attributes ? (
        <ParametersForm controller={controller} embedded={driver?.embedded} />
      ) : (
        <group as="div">
          <InputField
            type="text"
            name="url"
            value={controller.config.url}
            onChange={value => controller.onChange('url', value)}
            disabled={controller.isConnecting}
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
            autofillToken='new-password'
            properties={controller.authModel.properties}
            credentials={controller.config.credentials}
            disabled={controller.isConnecting}
          />
        </>
      )}
    </connection-form>
  );
});
