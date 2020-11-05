/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css, use } from 'reshadow';

import { FormGroup, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { AdminConnection } from '../../../ConnectionsResource';

interface ParametersFormProps {
  connection: AdminConnection;
  disabled?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
}

const parametersFormStyles = css`
  sub-label {
    composes: theme-typography--caption from global;
    line-height: 14px;
  }`;

export const ParametersForm = observer(function ParametersForm({
  connection,
  embedded,
  disabled,
  readOnly,
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
              state={connection}
              disabled={disabled}
              readOnly={readOnly}
              mod='surface'
            >
              {translate('customConnection_custom_host')}
              <sub-label as="div">{translate('customConnection_custom_obligatory')}</sub-label>
            </InputField>
          </layout-grid-cell>
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 4 })}>
            <InputField
              type="number"
              name="port"
              state={connection}
              disabled={disabled}
              readOnly={readOnly}
              mod='surface'
              short
            >
              {translate('customConnection_custom_port')}
            </InputField>
          </layout-grid-cell>
        </layout-grid-inner>
      )}
      <FormGroup>
        <InputField
          type="text"
          name="databaseName"
          state={connection}
          disabled={disabled}
          readOnly={readOnly}
          mod='surface'
        >
          {translate('customConnection_custom_database')}
        </InputField>
      </FormGroup>
    </>
  );
});
