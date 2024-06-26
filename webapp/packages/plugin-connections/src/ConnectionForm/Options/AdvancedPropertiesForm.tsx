/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Expandable, Group, InputField, useTranslate } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

const MAX_KEEP_ALIVE_INTERVAL = 32767;
const DEFAULT_CONFIG: ConnectionConfig = {
  keepAliveInterval: 0,
};

interface Props {
  config: ConnectionConfig;
  disabled?: boolean;
  readonly?: boolean;
}

export const AdvancedPropertiesForm = observer<Props>(function AdvancedPropertiesForm({ config, disabled, readonly }) {
  const translate = useTranslate();

  return (
    <Group form gap>
      <Expandable label={translate('ui_advanced_settings')}>
        <InputField
          type="number"
          minLength={1}
          min={0}
          max={MAX_KEEP_ALIVE_INTERVAL}
          name="keepAliveInterval"
          disabled={disabled}
          readOnly={readonly}
          title={translate('connections_connection_keep_alive_tooltip')}
          state={config}
          defaultState={DEFAULT_CONFIG}
        >
          {translate('connections_connection_keep_alive')}
        </InputField>
      </Expandable>
    </Group>
  );
});
