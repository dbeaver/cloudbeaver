/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';

import { Button } from '../Button.js';
import { Filter } from '../FormControls/Filter.js';
import { useTranslate } from '../localization/useTranslate.js';
import { s } from '../s.js';
import { useObjectRef } from '../useObjectRef.js';
import { useS } from '../useS.js';
import type { IProperty } from './IProperty.js';
import styles from './PropertiesTable.module.css';
import propertiesTableAddButtonStyles from './PropertiesTableAddButtonStyles.module.css';
import { PropertyItem } from './PropertyItem.js';

type PropertiesState = Record<string, string | null>;

interface Props {
  properties: IProperty[];
  propertiesState?: PropertiesState;
  readOnly?: boolean;
  onKeyChange?: (id: string, name: string) => void;
  onChange?: (state: PropertiesState) => void;
  onAdd?: () => void;
  onRemove?: (property: IProperty) => void;
  className?: string;
  filterable?: boolean;
}

export const PropertiesTable = observer<Props>(function PropertiesTable(props) {
  const { className, onAdd, readOnly, propertiesState } = props;
  const translate = useTranslate();
  const propsRef = useObjectRef({ ...props });
  const style = useS(styles);

  const [filterValue, setFilterValue] = useState('');

  const sortedProperties = useMemo(
    () =>
      computed(() =>
        propsRef.properties
          .slice()
          .sort((a, b) => (a.displayName ?? '').localeCompare(b.displayName ?? ''))
          .filter(p => p.new || p.key.toLocaleLowerCase().includes(filterValue.toLocaleLowerCase())),
      ),
    [propsRef.properties, filterValue],
  );

  const changeName = useCallback((id: string, key: string) => {
    const { properties, propertiesState, onKeyChange } = propsRef;
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (propertiesState) {
      const isUnique = properties.filter(({ key }) => key === property.key).length === 1;

      if (propertiesState[property.key] !== undefined && isUnique) {
        propertiesState[key] = propertiesState[property.key]!;
        // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
        delete propertiesState[property.key];
      }
    }

    if (onKeyChange) {
      onKeyChange(property.key, key);
    }
    property.key = key;
  }, []);

  const changeValue = useCallback((id: string, value: string | null) => {
    const { properties, propertiesState, onChange } = propsRef;
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    if (propertiesState) {
      if (value === property.defaultValue) {
        delete propertiesState[property.key];
      } else {
        propertiesState[property.key] = value;
      }

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

  const isKeyUnique = useCallback((key: string) => propsRef.properties.filter(property => property.key === key).length === 1, []);

  return (
    <div className={s(style, { properties: true }, className)}>
      <div className={s(style, { propertiesHeader: true })}>
        <div className={s(style, { propertiesHeaderName: true })}>
          <div>{translate('core_block_properties_table_name')}</div>
          {props.filterable ? (
            <Filter value={filterValue} placeholder={translate('core_block_properties_table_filter_name')} smallSize onChange={setFilterValue} />
          ) : null}
        </div>
        <div className={s(style, { propertiesHeaderValue: true })}>{translate('core_block_properties_table_value')}</div>
      </div>
      <div className={s(style, { propertiesList: true })}>
        {onAdd && !readOnly && (
          <div className={s(style, { propertiesHeaderAdd: true })}>
            <Button
              className={s(propertiesTableAddButtonStyles, { buttonLabel: true })}
              icon="add_sm"
              iconPlacement="start"
              iconSize={18}
              viewBox="0 0 18 18"
              variant="secondary"
              type="button"
              onClick={() => onAdd()}
            >
              {translate('core_block_properties_table_add')}
            </Button>
          </div>
        )}
        {sortedProperties.get().map(property => (
          <PropertyItem
            key={property.id}
            property={property}
            value={propertiesState?.[property.key] ?? undefined}
            error={!isKeyUnique(property.key)}
            readOnly={readOnly}
            onNameChange={changeName}
            onValueChange={changeValue}
            onRemove={removeProperty}
          />
        ))}
        <div className={s(style, { propertiesListOverflow: true })} />
      </div>
    </div>
  );
});
