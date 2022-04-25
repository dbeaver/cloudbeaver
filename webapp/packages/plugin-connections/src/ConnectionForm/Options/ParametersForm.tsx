/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Container, InputField } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  config: ConnectionConfig;
  disabled?: boolean;
  embedded?: boolean;
  requiresServerName?: boolean;
  readOnly?: boolean;
  originLocal?: boolean;
}

export const ParametersForm = observer<Props>(function ParametersForm({
  config,
  embedded,
  requiresServerName,
  disabled,
  readOnly,
  originLocal,
}) {
  const translate = useTranslate();

  return styled(useStyles(BASE_CONTAINERS_STYLES))(
    <Container gap>
      {!embedded && (
        <Container wrap gap>
          <InputField
            type="text"
            name="host"
            state={config}
            disabled={disabled}
            readOnly={readOnly || !originLocal}
            small
            required
          >
            {translate('customConnection_custom_host')}
          </InputField>
          <InputField
            type="number"
            name="port"
            state={config}
            disabled={disabled}
            readOnly={readOnly || !originLocal}
            tiny
          >
            {translate('customConnection_custom_port')}
          </InputField>
        </Container>
      )}
      <InputField
        type="text"
        name="databaseName"
        state={config}
        disabled={disabled}
        readOnly={readOnly}
      >
        {translate('customConnection_custom_database')}
      </InputField>
      {requiresServerName && (
        <InputField
          type="text"
          name="serverName"
          state={config}
          disabled={disabled}
          readOnly={readOnly}
          required
        >
          {translate('customConnection_custom_server_name')}
        </InputField>
      )}
    </Container>
  );
});
