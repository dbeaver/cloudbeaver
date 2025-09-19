/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Expandable, Group, ObjectPropertyInfoForm, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { DBDriverExpertSettingsResource } from '@cloudbeaver/core-connections';

interface Props {
  config: ConnectionConfig;
  disabled?: boolean;
  readonly?: boolean;
}

export const AdvancedPropertiesForm = observer<Props>(function AdvancedPropertiesForm({ config, disabled, readonly }) {
  const translate = useTranslate();
  const properties = useResource(AdvancedPropertiesForm, DBDriverExpertSettingsResource, config.driverId ?? null);

  if (!properties.data?.length) {
    return null;
  }

  return (
    <Group form gap>
      <Expandable label={translate('connections_connection_expert_settings')}>
        <Container wrap gap>
          <ObjectPropertyInfoForm state={config.expertSettingsValues} properties={properties.data} disabled={disabled} readOnly={readonly} />
        </Container>
      </Expandable>
    </Group>
  );
});
