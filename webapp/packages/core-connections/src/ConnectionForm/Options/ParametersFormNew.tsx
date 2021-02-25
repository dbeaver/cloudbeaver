/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { BASE_CONTAINERS_STYLES, FormGroup, Grid, Group, InputField, InputFieldNew } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

interface ParametersFormProps {
  config: ConnectionConfig;
  disabled?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
}

const parametersFormStyles = css`
  sub-label {
    composes: theme-typography--caption from global;
    line-height: 14px;
  }`;

export const ParametersFormNew = observer(function ParametersFormNew({
  config,
  embedded,
  disabled,
  readOnly,
}: ParametersFormProps) {
  const translate = useTranslate();

  return styled(useStyles(parametersFormStyles, BASE_CONTAINERS_STYLES))(
    <Grid>
      {!embedded && (
        <Grid horizontal>
          <InputFieldNew
            type="text"
            name="host"
            state={config}
            disabled={disabled}
            readOnly={readOnly}
            large
            required
          >
            {translate('customConnection_custom_host')}
          </InputFieldNew>
          <InputFieldNew
            type="number"
            name="port"
            state={config}
            disabled={disabled}
            readOnly={readOnly}
          >
            {translate('customConnection_custom_port')}
          </InputFieldNew>
        </Grid>
      )}
      <InputFieldNew
        type="text"
        name="databaseName"
        state={config}
        disabled={disabled}
        readOnly={readOnly}
        full
      >
        {translate('customConnection_custom_database')}
      </InputFieldNew>
    </Grid>
  );
});
