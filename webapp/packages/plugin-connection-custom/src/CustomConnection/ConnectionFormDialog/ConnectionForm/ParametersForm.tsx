/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use } from 'reshadow';

import { InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { formStyles } from './formStyles';
import { IFormController } from './IFormController';

interface ParametersFormProps {
  controller: IFormController;
  embedded?: boolean;
}

export const ParametersForm = observer(function ParametersForm({
  controller,
  embedded,
}: ParametersFormProps) {
  const translate = useTranslate();

  return styled(useStyles(formStyles))(
    <>
      {!embedded && (
        <group as="div">
          <InputField
            type="text"
            name="host"
            value={controller.config.host}
            disabled={controller.isConnecting}
            mod='surface'
            onChange={value => controller.onChange('host', value)}
          >
            {translate('customConnection_custom_host')}
            <sub-label as="div">{translate('customConnection_custom_obligatory')}</sub-label>
          </InputField>
          <InputField
            type="number"
            name="port"
            value={controller.config.port}
            disabled={controller.isConnecting}
            mod='surface'
            onChange={value => controller.onChange('port', value)}
          >
            {translate('customConnection_custom_port')}
          </InputField>
        </group>
      )}
      <group as="div">
        <InputField
          type="text"
          name="databaseName"
          value={controller.config.databaseName}
          disabled={controller.isConnecting}
          mod='surface'
          onChange={value => controller.onChange('databaseName', value)}
        >
          {translate('customConnection_custom_database')}
        </InputField>
      </group>
    </>
  );
});
