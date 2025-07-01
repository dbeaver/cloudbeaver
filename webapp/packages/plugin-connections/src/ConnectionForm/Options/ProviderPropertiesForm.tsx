/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Container,
  Expandable,
  Group,
  GroupTitle,
  ObjectPropertyInfoForm,
  useObjectPropertyCategories,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { type DriverPropertyInfoFragment, getObjectPropertyType } from '@cloudbeaver/core-sdk';
import type { IConnectionFormOptionsState } from './IConnectionFormOptionsState.js';

type DriverPropertyInfo = DriverPropertyInfoFragment;

interface Props {
  config: IConnectionFormOptionsState;
  properties: DriverPropertyInfo[];
  disabled?: boolean;
  readonly?: boolean;
}

export const ProviderPropertiesForm = observer<Props>(function ProviderPropertiesForm({ config, properties, disabled, readonly }) {
  const translate = useTranslate();
  const supportedProperties = properties.filter(property => property.supportedConfigurationTypes?.some(type => type === config.configurationType));

  const { categories, isUncategorizedExists } = useObjectPropertyCategories(supportedProperties);

  if (!supportedProperties.length) {
    return null;
  }

  const booleanProperties = supportedProperties.filter(property => !property.category && property.dataType === 'Boolean');
  const nonBooleanProperties = supportedProperties.filter(property => !property.category && property.dataType !== 'Boolean');

  return (
    <Group form gap>
      {isUncategorizedExists && (
        <>
          <GroupTitle>{translate('ui_settings')}</GroupTitle>
          {booleanProperties.length > 0 && (
            <Container gap wrap dense>
              <ObjectPropertyInfoForm
                properties={booleanProperties}
                state={config.providerProperties}
                disabled={disabled}
                readOnly={readonly}
                maximum
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
        </>
      )}

      {categories.map((category, index) => (
        <Container key={`${category}_${config.driverId}`} gap>
          <Expandable label={category} defaultExpanded={index === 0}>
            <Container dense={isOnlyBooleans(supportedProperties, category)} wrap gap>
              <ObjectPropertyInfoForm
                properties={supportedProperties}
                state={config.providerProperties}
                category={category}
                disabled={disabled}
                readOnly={readonly}
                geLayoutSize={property => (getObjectPropertyType(property) === 'checkbox' ? { maximum: true } : { small: true, noGrow: true })}
                hideEmptyPlaceholder
              />
            </Container>
          </Expandable>
        </Container>
      ))}
    </Group>
  );
});

function isOnlyBooleans(properties: DriverPropertyInfo[], category?: string): boolean {
  return properties.filter(property => !category || property.category === category).every(property => property.dataType === 'Boolean');
}
