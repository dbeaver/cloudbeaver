/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useDeferredValue, useMemo, useRef, useState } from 'react';

import { Button, Filter, s, TextPlaceholder, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { getObjectPropertyOptionValue } from '@cloudbeaver/core-sdk';
import { DataGrid, type DataGridRef, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';
import { isNotNullDefined } from '@dbeaver/js-helpers';

import classes from './DriverPropertiesTable.module.css';
import { DriverPropertyActionsCell } from './DriverPropertyActionsCell.js';
import { DriverPropertyNameCell } from './DriverPropertyNameCell.js';
import { DriverPropertyValueCell } from './DriverPropertyValueCell.js';
import type { IDriverProperty } from './IDriverProperty.js';

const NAME_COLUMN = { key: 'name', label: 'core_block_properties_table_name', width: 'max-content', resizable: true };
const VALUE_COLUMN = { key: 'value', label: 'core_block_properties_table_value', width: 'minmax(200px, 1fr)', resizable: true };
const ACTIONS_COLUMN = { key: 'actions', label: '', width: 40, resizable: false };

const COLUMNS = [NAME_COLUMN, VALUE_COLUMN, ACTIONS_COLUMN];
const ROW_HEIGHT = 40;

type DriverPropertiesState = Record<string, string | null>;

interface Props {
  properties: IDriverProperty[];
  propertiesState: DriverPropertiesState;
  readOnly?: boolean;
  onAdd: () => string;
  onRemove: (property: IDriverProperty) => void;
}

export const DriverPropertiesTable = observer<Props>(function DriverPropertiesTable({ properties, propertiesState, readOnly, onAdd, onRemove }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const dataGridRef = useRef<DataGridRef>(null);
  const [filterValue, setFilterValue] = useState('');
  const [propertyIdToFocus, setPropertyIdToFocus] = useState<string | null>(null);
  const deferredFilterValue = useDeferredValue(filterValue);

  const visibleProperties = useMemo(
    () =>
      computed(() => {
        const filter = deferredFilterValue.trim().toLocaleLowerCase();

        return properties
          .slice()
          .sort((a, b) => {
            if (a.custom !== b.custom) {
              return a.custom ? -1 : 1;
            }

            if (a.custom) {
              return 0;
            }

            return (a.displayName ?? a.key).localeCompare(b.displayName ?? b.key);
          })
          .filter(property => {
            if (property.new || !filter) {
              return true;
            }

            return property.key.toLocaleLowerCase().includes(filter) || property.displayName?.toLocaleLowerCase().includes(filter);
          });
      }),
    [properties, deferredFilterValue],
  );
  const keyCounts = useMemo(
    () =>
      computed(() => {
        const counts = new Map<string, number>();

        for (const property of properties) {
          counts.set(property.key, (counts.get(property.key) ?? 0) + 1);
        }

        return counts;
      }),
    [properties],
  );

  function isKeyUnique(key: string) {
    return keyCounts.get().get(key) === 1;
  }

  function changeName(id: string, key: string) {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    const previousKey = property.key;
    const previousKeyIsUnique = isKeyUnique(previousKey);

    if (propertiesState[previousKey] !== undefined && previousKeyIsUnique) {
      propertiesState[key] = propertiesState[previousKey]!;
      delete propertiesState[previousKey];
    }

    property.key = key;
  }

  function changeValue(id: string, value: string | null) {
    const property = properties.find(property => property.id === id);

    if (!property) {
      return;
    }

    const defaultValue = isNotNullDefined(property.defaultValue) ? String(getObjectPropertyOptionValue(property.defaultValue)) : undefined;
    if (value === defaultValue) {
      delete propertiesState[property.key];
    } else {
      propertiesState[property.key] = value;
    }
  }

  function resetValue(id: string) {
    const property = properties.find(property => property.id === id);

    if (property) {
      const defaultValue = isNotNullDefined(property.defaultValue) ? String(getObjectPropertyOptionValue(property.defaultValue)) : null;
      changeValue(id, defaultValue);
    }
  }

  function removeProperty(property: IDriverProperty) {
    if (propertiesState[property.key] !== undefined) {
      delete propertiesState[property.key];
    }

    onRemove(property);
  }

  function addProperty() {
    const newPropertyId = onAdd();
    setPropertyIdToFocus(newPropertyId);
    requestAnimationFrame(() => dataGridRef.current?.scrollToCell({ rowIdx: 0, colIdx: COLUMNS.indexOf(NAME_COLUMN) }));
  }

  function getCell(rowIdx: number, colIdx: number, tabIndex: number) {
    const property = visibleProperties.get()[rowIdx];
    const column = COLUMNS[colIdx];

    if (!property || !column) {
      return null;
    }

    if (column.key === NAME_COLUMN.key) {
      return (
        <DriverPropertyNameCell
          property={property}
          error={!isKeyUnique(property.key)}
          readOnly={readOnly}
          autoFocus={property.id === propertyIdToFocus}
          tabIndex={tabIndex}
          onChange={changeName}
          onFocusHandled={() => setPropertyIdToFocus(null)}
        />
      );
    }

    const value = propertiesState[property.key] ?? undefined;
    const defaultValue = isNotNullDefined(property.defaultValue) ? String(getObjectPropertyOptionValue(property.defaultValue)) : undefined;

    if (column.key === VALUE_COLUMN.key) {
      return <DriverPropertyValueCell property={property} value={value} readOnly={readOnly} tabIndex={tabIndex} onChange={changeValue} />;
    }

    if (column.key === ACTIONS_COLUMN.key) {
      return (
        <DriverPropertyActionsCell
          property={property}
          edited={value !== undefined && value !== defaultValue}
          readOnly={readOnly}
          tabIndex={tabIndex}
          onReset={resetValue}
          onRemove={removeProperty}
        />
      );
    }

    return null;
  }

  const cell = useCreateGridReactiveValue(
    getCell,
    (onValueChange, rowIdx, colIdx, tabIndex) => reaction(() => getCell(rowIdx, colIdx, tabIndex), onValueChange),
    [visibleProperties, keyCounts, propertiesState, readOnly, propertyIdToFocus, onRemove],
  );
  const columnsCount = useCreateGridReactiveValue(() => COLUMNS.length, null, []);
  const rowsCount = useCreateGridReactiveValue(
    () => visibleProperties.get().length,
    onValueChange => reaction(() => visibleProperties.get().length, onValueChange),
    [visibleProperties],
  );

  function getHeaderText(colIdx: number) {
    return translate(COLUMNS[colIdx]?.label) ?? '';
  }

  const headerText = useCreateGridReactiveValue(getHeaderText, null, [translate]);

  function getHeaderWidth(colIdx: number) {
    return COLUMNS[colIdx]?.width ?? null;
  }

  return (
    <div className={s(styles, { driverPropertiesTable: true })}>
      <div className={s(styles, { toolbar: true })}>
        <div className={s(styles, { filter: true })}>
          <Filter value={filterValue} placeholder={translate('core_block_properties_table_filter_name')} smallSize onChange={setFilterValue} />
        </div>
        {!readOnly && (
          <Button
            className={s(styles, { addButton: true })}
            icon="add_sm"
            iconPlacement="start"
            iconSize={16}
            viewBox="0 0 18 18"
            variant="primary"
            size="small"
            type="button"
            onClick={addProperty}
          >
            {translate('core_block_properties_table_add')}
          </Button>
        )}
      </div>
      <div className={s(styles, { gridContainer: true })} role="region" aria-label={translate('plugin_connections_connection_form_part_properties')}>
        <DataGrid
          ref={dataGridRef}
          className={s(styles, { dataGrid: true })}
          columnCount={columnsCount}
          rowCount={rowsCount}
          getColumnKey={colIdx => COLUMNS[colIdx]?.key ?? String(colIdx)}
          getHeaderWidth={getHeaderWidth}
          getHeaderResizable={colIdx => COLUMNS[colIdx]?.resizable ?? false}
          getRowHeight={() => ROW_HEIGHT}
          getRowId={rowIdx => visibleProperties.get()[rowIdx]?.id ?? rowIdx}
          getRowClass={rowIdx => (visibleProperties.get()[rowIdx]?.custom ? s(styles, { customRow: true }) : null)}
          headerText={headerText}
          cell={cell}
          onCellKeyDown={(_, event) => {
            const target = event.target;

            if (event.key !== 'Tab' && target instanceof HTMLElement && target.closest('.rdg-cell') !== target) {
              event.preventGridDefault();
            }
          }}
        >
          <div className="tw:col-span-full tw:flex tw:h-full tw:w-full">
            <TextPlaceholder>{translate('core_blocks_object_property_info_form_empty_placeholder')}</TextPlaceholder>
          </div>
        </DataGrid>
      </div>
    </div>
  );
});
