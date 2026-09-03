/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { InputField, useTranslate } from '@cloudbeaver/core-blocks';
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

  if (embedded) {
    return (
      <div className="tw:flex tw:flex-col tw:gap-4">
        <InputField type="text" name="databaseName" state={config} readOnly={readOnly || disabled} fill>
          {translate('plugin_connections_connection_form_part_main_custom_database')}
        </InputField>
        {requiresServerName && (
          <InputField type="text" name="serverName" state={config} readOnly={readOnly || disabled} required fill>
            {translate('plugin_connections_connection_form_part_main_custom_server_name')}
          </InputField>
        )}
      </div>
    );
  }

  return (
    <div className="tw:flex tw:flex-col tw:gap-4">
      <div className="tw:grid tw:grid-cols-1 tw:gap-4 tw:lg:grid-cols-[minmax(0,2fr)_minmax(8rem,0.75fr)]">
        <InputField type="text" name="host" state={config} readOnly={readOnly || !originLocal || disabled} required fill>
          {translate('plugin_connections_connection_form_part_main_custom_host')}
        </InputField>
        <InputField type="number" name="port" state={config} readOnly={readOnly || !originLocal || disabled} fill>
          {translate('plugin_connections_connection_form_part_main_custom_port')}
        </InputField>
      </div>
      <InputField type="text" name="databaseName" state={config} readOnly={readOnly || disabled} fill>
        {translate('plugin_connections_connection_form_part_main_custom_database')}
      </InputField>
      {requiresServerName && (
        <InputField type="text" name="serverName" state={config} readOnly={readOnly || disabled} required fill>
          {translate('plugin_connections_connection_form_part_main_custom_server_name')}
        </InputField>
      )}
    </div>
  );
});
