/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Grid, InputFieldNew } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

interface ParametersFormProps {
  config: ConnectionConfig;
  disabled?: boolean;
  embedded?: boolean;
  readOnly?: boolean;
  originLocal?: boolean;
}

export const ParametersFormNew = observer(function ParametersFormNew({
  config,
  embedded,
  disabled,
  readOnly,
  originLocal,
}: ParametersFormProps) {
  const translate = useTranslate();

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Grid horizontal>
      {!embedded && (
        <>
          <InputFieldNew
            type="text"
            name="host"
            state={config}
            disabled={disabled}
            readOnly={readOnly || !originLocal}
            gridItemMedium
            required
          >
            {translate('customConnection_custom_host')}
          </InputFieldNew>
          <InputFieldNew
            type="number"
            name="port"
            state={config}
            disabled={disabled}
            readOnly={readOnly || !originLocal}
          >
            {translate('customConnection_custom_port')}
          </InputFieldNew>
        </>
      )}
      <InputFieldNew
        type="text"
        name="databaseName"
        state={config}
        disabled={disabled}
        readOnly={readOnly}
        gridItemMax
      >
        {translate('customConnection_custom_database')}
      </InputFieldNew>
    </Grid>
  );
});
