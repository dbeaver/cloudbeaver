/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, InputField, useTranslate } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

interface Props {
  config: ConnectionConfig;
  disabled?: boolean;
  embedded?: boolean;
  requiresServerName?: boolean;
  readOnly?: boolean;
  originLocal?: boolean;
}

export const ParametersForm = observer<Props>(function ParametersForm({ config, embedded, requiresServerName, disabled, readOnly, originLocal }) {
  const translate = useTranslate();

  return (
    <Container gap>
      {!embedded && (
        <Container wrap gap>
          <InputField type="text" name="host" state={config} readOnly={readOnly || !originLocal || disabled} small required>
            {translate('plugin_connections_connection_form_part_main_custom_host')}
          </InputField>
          <InputField type="number" name="port" state={config} readOnly={readOnly || !originLocal || disabled} tiny>
            {translate('plugin_connections_connection_form_part_main_custom_port')}
          </InputField>
        </Container>
      )}
      <InputField type="text" name="databaseName" state={config} readOnly={readOnly || disabled}>
        {translate('plugin_connections_connection_form_part_main_custom_database')}
      </InputField>
      {requiresServerName && (
        <InputField type="text" name="serverName" state={config} readOnly={readOnly || disabled} required>
          {translate('plugin_connections_connection_form_part_main_custom_server_name')}
        </InputField>
      )}
    </Container>
  );
});
