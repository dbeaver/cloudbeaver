/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import { InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { formStyles } from './formStyles';

type ParametersFormProps = {
  connection: ConnectionInfo;
  disabled?: boolean;
  embedded?: boolean;
}

const styles = css`
  layout-grid-inner {
    max-width: 650px;
  }
`;

export const ParametersForm = observer(function ParametersForm({
  connection,
  embedded,
  disabled,
}: ParametersFormProps) {
  const translate = useTranslate();

  return styled(useStyles(formStyles, styles))(
    <>
      { !embedded && (
        <layout-grid-inner as="div">
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 7 })}>
            <InputField
              type="text"
              name="host"
              state={connection}
              disabled={disabled}
              mod='surface'
            >
              {translate('customConnection_custom_host')}
              <sub-label as="div">{translate('customConnection_custom_obligatory')}</sub-label>
            </InputField>
          </layout-grid-cell>
          <layout-grid-cell as='div' {...use({ 'span-tablet': 12, 'span-desktop': 5 })}>
            <InputField
              type="number"
              name="port"
              state={connection}
              disabled={disabled}
              {...use({ short: true })}
              mod='surface'
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
          state={connection}
          disabled={disabled}
          mod='surface'
        >
          {translate('customConnection_custom_database')}
        </InputField>
      </group>
    </>
  );
});
