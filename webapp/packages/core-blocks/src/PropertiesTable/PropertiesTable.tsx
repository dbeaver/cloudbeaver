/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer, useLocalStore } from 'mobx-react';
import { useCallback } from 'react';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { IProperty } from './IProperty';
import { PropertyItem } from './PropertyItem';
import { PROPERTIES_TABLE_STYLES } from './styles';

type PropertiesState = Record<string, string>

type PropertiesTableProps = {
  properties: IProperty[];
  propertiesState?: PropertiesState;
  onKeyChange?(id: string, name: string): void;
  onChange?(state: PropertiesState): void;
  onAdd?(): void;
  onRemove?(id: string): void;
  className?: string;
}

export const PropertiesTable = observer(function PropertiesTable({
  propertiesState,
  properties,
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

    if (state[property.key] !== undefined) {
      state[key] = state[property.key];
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
          {onAdd && <Button type='button' mod={['outlined']} onClick={() => onAdd()}>{translate('block_properties_table_add')}</Button> }
        </properties-header-right>
      </properties-header>
      <properties-list as="div">
        {properties.map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            value={state[property.key]}
            onNameChange={changeName}
            onValueChange={changeValue}
            onRemove={removeProperty}
            error={!isKeyUnique(property.key)}
          />
        ))}
      </properties-list>
    </properties>
  );
});
