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

import { Button } from '@dbeaver/core/blocks';
import { useTranslate } from '@dbeaver/core/localization';
import { useStyles } from '@dbeaver/core/theming';

import { IProperty } from './IProperty';
import { PropertyItem } from './PropertyItem';
import { PROPERTIES_TABLE_STYLES } from './styles';


type PropertiesState = {
  [key: string]: string;
}

type PropertiesTableProps = {
  properties: IProperty[];
  propertiesState?: PropertiesState;
  onNameChange?(id: string, name: string): void;
  onChange?(state: PropertiesState): void;
  onAdd?(): void;
  onRemove?(id: string): void;
  className?: string;
}

export const PropertiesTable = observer(function PropertiesTable({
  propertiesState,
  properties,
  onNameChange,
  onChange,
  onAdd,
  onRemove,
  className,
}: PropertiesTableProps) {
  const translate = useTranslate();
  const state = useLocalStore<PropertiesState>(() => (propertiesState || {}));
  const changeName = useCallback((id: string, name: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (state[property.name] !== undefined) {
      state[name] = state[property.name];
      delete state[property.name];
    }

    if (onNameChange) {
      onNameChange(property.name, name);
    }
    property.name = name;
  }, [properties]);

  const changeValue = useCallback((id: string, value: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    state[property.name] = value;

    if (onChange) {
      onChange(state);
    }
  }, [properties, onChange]);

  const removeProperty = useCallback((id: string) => {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (state[property.name] !== undefined) {
      delete state[property.name];
    }

    if (onRemove) {
      onRemove(id);
    }
    properties.splice(properties.indexOf(property), 1);
  }, [properties, onRemove]);

  const isNameUnique = useCallback(
    (name: string) => properties.filter(property => property.name === name).length === 1,
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
          {onAdd && <Button type='button' mod={['outlined']} onClick={onAdd}>{translate('block_properties_table_add')}</Button> }
        </properties-header-right>
      </properties-header>
      <properties-list as="div">
        {properties.map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            value={state[property.name]}
            onNameChange={changeName}
            onValueChange={changeValue}
            onRemove={removeProperty}
            error={!isNameUnique(property.name)}
          />
        ))}
      </properties-list>
    </properties>
  );
});
