/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { BASE_CONTAINERS_STYLES, Container, useTranslate, Group, GroupTitle, ObjectPropertyInfoForm } from '@cloudbeaver/core-blocks';
import type { ConnectionConfig, DriverProviderPropertyInfoFragment } from '@cloudbeaver/core-sdk';

type DriverProviderPropertyInfo = DriverProviderPropertyInfoFragment;

interface Props {
  config: ConnectionConfig;
  properties: DriverProviderPropertyInfo[];
  disabled?: boolean;
  readonly?: boolean;
}

export const ProviderPropertiesForm = observer<Props>(function ProviderPropertiesForm({
  config,
  properties,
  disabled,
  readonly,
}) {
  const translate = useTranslate();

  const supportedProperties = properties.filter(
    property => property.supportedConfigurationTypes?.some(type => type === config.configurationType)
  );

  if (!supportedProperties.length) {
    return null;
  }

  const booleanProperties = supportedProperties.filter(property => property.dataType === 'Boolean');
  const nonBooleanProperties = supportedProperties.filter(property => property.dataType !== 'Boolean');

  return styled(BASE_CONTAINERS_STYLES)(
    <Group form gap>
      <GroupTitle>{translate('ui_settings')}</GroupTitle>
      {booleanProperties.length > 0 && (
        <Container gap wrap>
          <ObjectPropertyInfoForm
            properties={booleanProperties}
            state={config.providerProperties}
            disabled={disabled}
            readOnly={readonly}
            keepSize
            hideEmptyPlaceholder
          />
        </Container>
      )}
      {nonBooleanProperties.length > 0 && (
        <Container wrap gap>
          <ObjectPropertyInfoForm
            properties={nonBooleanProperties}
            state={config.providerProperties}
            disabled={disabled}
            readOnly={readonly}
            tiny
            hideEmptyPlaceholder
          />
        </Container>
      )}
    </Group>
  );
});
