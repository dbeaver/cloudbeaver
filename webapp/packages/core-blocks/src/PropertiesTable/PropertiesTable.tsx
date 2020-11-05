/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer, useLocalStore } from 'mobx-react';
import { useCallback, useMemo } from 'react';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { IProperty } from './IProperty';
import { PropertyItem } from './PropertyItem';
import { PROPERTIES_TABLE_STYLES } from './styles';

type PropertiesState = Record<string, string>;

interface PropertiesTableProps {
  properties: IProperty[];
  propertiesState?: PropertiesState;
  readOnly?: boolean;
  onKeyChange?: (id: string, name: string) => void;
  onChange?: (state: PropertiesState) => void;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
  className?: string;
}

export const PropertiesTable = observer(function PropertiesTable({
  properties,
  propertiesState,
  readOnly,
  onKeyChange,
  onChange,
  onAdd,
  onRemove,
  className,
}: PropertiesTableProps) {
  const translate = useTranslate();
  const state = useLocalStore<PropertiesState>(() => (propertiesState || {}));
  const changeName = useCallback((id: string, key: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    const isUnique = properties.filter(({ key }) => key === property.key).length === 1;

    if (state[property.key] !== undefined && isUnique) {
      state[key] = state[property.key];
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[property.key];
    }

    if (onKeyChange) {
      onKeyChange(property.key, key);
    }
    property.key = key;
  }, [properties]);

  const changeValue = useCallback((id: string, value: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    state[property.key] = value;

    if (onChange) {
      onChange(state);
    }
  }, [properties, onChange]);

  const removeProperty = useCallback((id: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (state[property.key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete state[property.key];
    }

    if (onRemove) {
      onRemove(id);
    }
    properties.splice(properties.indexOf(property), 1);
  }, [properties, onRemove]);

  const isKeyUnique = useCallback(
    (key: string) => properties.filter(property => property.key === key).length === 1,
    []
  );

  const alphabetOrderProperties = useMemo(() => computed(() => properties.slice().sort(
    (a, b) => (a?.displayName ?? '').localeCompare(b?.displayName ?? ''))), [properties]);

  return styled(useStyles(PROPERTIES_TABLE_STYLES))(
    <properties as="div" className={className}>
      <properties-header as="div">
        <properties-header-name as="div">
          {translate('block_properties_table_name')}
        </properties-header-name>
        <properties-header-value as="div">
          {translate('block_properties_table_value')}
        </properties-header-value>
        <properties-header-right as="div">
          {onAdd && !readOnly && <Button type='button' mod={['outlined']} onClick={() => onAdd()}>{translate('block_properties_table_add')}</Button>}
        </properties-header-right>
      </properties-header>
      <properties-list as="div">
        {alphabetOrderProperties.get().map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            value={state[property.key]}
            error={!isKeyUnique(property.key)}
            readOnly={readOnly}
            onNameChange={changeName}
            onValueChange={changeValue}
            onRemove={removeProperty}
          />
        ))}
      </properties-list>
    </properties>
  );
});
