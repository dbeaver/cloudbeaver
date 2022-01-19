/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo } from 'react';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

import { Button } from '../Button';
import { useObjectRef } from '../useObjectRef';
import type { IProperty } from './IProperty';
import { PropertyItem } from './PropertyItem';
import { PROPERTIES_TABLE_ADD_STYLES, PROPERTIES_TABLE_STYLES } from './styles';

type PropertiesState = Record<string, string>;

interface Props {
  properties: IProperty[];
  propertiesState?: PropertiesState;
  readOnly?: boolean;
  onKeyChange?: (id: string, name: string) => void;
  onChange?: (state: PropertiesState) => void;
  onAdd?: () => void;
  onRemove?: (property: IProperty) => void;
  className?: string;
}

export const PropertiesTable = observer<Props>(function PropertiesTable(props) {
  const { className, onAdd, readOnly, propertiesState } = props;
  const translate = useTranslate();
  const propsRef = useObjectRef({ ...props });

  const sortedProperties = useMemo(() => computed(() => propsRef.properties.slice().sort(
    (a, b) => (a?.displayName ?? '').localeCompare(b?.displayName ?? ''))), [propsRef.properties]);

  const changeName = useCallback((id: string, key: string) => {
    const { properties, propertiesState, onKeyChange } = propsRef;
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (propertiesState) {
      const isUnique = properties.filter(({ key }) => key === property.key).length === 1;

      if (propertiesState[property.key] !== undefined && isUnique) {
        propertiesState[key] = propertiesState[property.key];
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete propertiesState[property.key];
      }
    }

    if (onKeyChange) {
      onKeyChange(property.key, key);
    }
    property.key = key;
  }, []);

  const changeValue = useCallback((id: string, value: string) => {
    const { properties, propertiesState, onChange } = propsRef;
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (propertiesState) {
      propertiesState[property.key] = value;

      if (onChange) {
        onChange(propertiesState);
      }
    }
  }, []);

  const removeProperty = useCallback((id: string) => {
    const { properties, propertiesState, onRemove } = propsRef;
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (propertiesState?.[property.key] !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete propertiesState[property.key];
    }

    if (onRemove) {
      onRemove(property);
    }
  }, []);

  const isKeyUnique = useCallback(
    (key: string) => propsRef.properties.filter(property => property.key === key).length === 1,
    []
  );

  return styled(useStyles(PROPERTIES_TABLE_STYLES))(
    <properties className={className}>
      <properties-header>
        <properties-header-name>
          {translate('block_properties_table_name')}
        </properties-header-name>
        <properties-header-value>
          {translate('block_properties_table_value')}
        </properties-header-value>
      </properties-header>
      <properties-list>
        {onAdd && !readOnly && (
          <properties-header-add>
            <Button
              icon='add_sm'
              viewBox="0 0 18 18"
              type='button'
              styles={PROPERTIES_TABLE_ADD_STYLES}
              onClick={() => onAdd()}
            >
              {translate('block_properties_table_add')}
            </Button>
          </properties-header-add>
        )}
        {sortedProperties.get().map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            value={propertiesState?.[property.key]}
            error={!isKeyUnique(property.key)}
            readOnly={readOnly}
            onNameChange={changeName}
            onValueChange={changeValue}
            onRemove={removeProperty}
          />
        ))}
        <properties-list-overflow />
      </properties-list>
    </properties>
  );
});
