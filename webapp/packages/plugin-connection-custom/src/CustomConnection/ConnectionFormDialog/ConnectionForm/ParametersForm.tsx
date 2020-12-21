/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { IFormController } from './IFormController';

interface ParametersFormProps {
  controller: IFormController;
  embedded?: boolean;
}

const parametersFormStyles = css`
  sub-label {
    composes: theme-typography--caption from global;
    line-height: 14px;
  }`;

export const ParametersForm = observer(function ParametersForm({
  controller,
  embedded,
}: ParametersFormProps) {
  const translate = useTranslate();

  return styled(useStyles(parametersFormStyles))(
    <>
      {!embedded && (
        <layout-grid-inner as="div">
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 8 })}>
            <InputField
              type="text"
              name="host"
              disabled={controller.isConnecting}
              mod='surface'
              state={controller.config}
            >
              {translate('customConnection_custom_host')}
              <sub-label as="div">{translate('customConnection_custom_obligatory')}</sub-label>
            </InputField>
          </layout-grid-cell>
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 4 })}>
            <InputField
              type="number"
              name="port"
              disabled={controller.isConnecting}
              mod='surface'
              state={controller.config}
              short
            >
              {translate('customConnection_custom_port')}
            </InputField>
          </layout-grid-cell>
        </layout-grid-inner>
      )}
      <group as="div">
        <InputField
          type="text"
          name="databaseName"
          disabled={controller.isConnecting}
          mod='surface'
          state={controller.config}
        >
          {translate('customConnection_custom_database')}
        </InputField>
      </group>
    </>
  );
});
