/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Expandable, FieldCheckbox, Group, InputField, useTranslate } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';

const MAX_KEEP_ALIVE_INTERVAL = 32767;
const DEFAULT_CONFIG: ConnectionConfig = {
  keepAliveInterval: 0,
  autocommit: true,
  readOnly: false,
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
      <Expandable label={translate('connections_connection_expert_settings')}>
        <Container wrap gap>
          <InputField
            type="number"
            minLength={1}
            min={0}
            max={MAX_KEEP_ALIVE_INTERVAL}
            name="keepAliveInterval"
            readOnly={readonly || disabled}
            title={translate('connections_connection_keep_alive_tooltip')}
            state={config}
            defaultState={DEFAULT_CONFIG}
          >
            {translate('connections_connection_keep_alive')}
          </InputField>

          <FieldCheckbox
            name="autocommit"
            state={config}
            defaultChecked={DEFAULT_CONFIG.autocommit}
            title={translate('connections_connection_autocommit')}
            disabled={disabled}
            readOnly={readonly}
          >
            {translate('connections_connection_autocommit')}
          </FieldCheckbox>

          <FieldCheckbox
            name="readOnly"
            state={config}
            defaultChecked={DEFAULT_CONFIG.readOnly}
            title={translate('connections_connection_read_only')}
            disabled={disabled}
            readOnly={readonly}
          >
            {translate('connections_connection_read_only')}
          </FieldCheckbox>
        </Container>
      </Expandable>
    </Group>
  );
});
