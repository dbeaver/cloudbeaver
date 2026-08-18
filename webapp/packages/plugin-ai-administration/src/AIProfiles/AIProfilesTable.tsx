/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';

import { IconOrImage, Link, s, TextPlaceholder, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT, AdministrationTableStyles } from '@cloudbeaver/core-administration';
import { DataGrid, TableRowSelect, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { Command } from '@dbeaver/ui-kit';

import { AIProfileFormService } from './AIProfileForm/AIProfileFormService.js';
import type { AIProfile } from './AIProfilesResource.js';

interface Props {
  profiles: AIProfile[];
  defaultProfileId: string | null;
}

const SELECT_COLUMN = { key: 'select', label: '' };
const NAME_COLUMN = { key: 'name', label: 'plugin_ai_administration_profile_column_name' };
const ENGINE_COLUMN = { key: 'engine', label: 'plugin_ai_administration_profile_column_engine' };

const COLUMNS = [SELECT_COLUMN, NAME_COLUMN, ENGINE_COLUMN];

export const AIProfilesTable = observer<Props>(function AIProfilesTable({ profiles, defaultProfileId }) {
  const translate = useTranslate();
  const styles = useS(AdministrationTableStyles);
  const aiProfileFormService = useService(AIProfileFormService);
  const enginesLoader = useResource(AIProfilesTable, AiEnginesResource, undefined);

  const columnsCount = useCreateGridReactiveValue(() => COLUMNS.length, null, [COLUMNS]);
  const rowsCount = useCreateGridReactiveValue(
    () => profiles.length,
    onValueChange => reaction(() => profiles.length, onValueChange),
    [profiles],
  );

  function getCell(rowIdx: number, colIdx: number) {
    const profile = profiles[rowIdx];
    const column = COLUMNS[colIdx];

    if (!profile || !column) {
      return null;
    }

    const isDefault = profile.id === defaultProfileId;

    if (column.key === SELECT_COLUMN.key) {
      return (
        <TableRowSelect
          id={profile.id}
          disabled={isDefault}
          title={isDefault ? translate('plugin_ai_administration_profile_default_delete_info') : undefined}
        />
      );
    }

    if (column.key === NAME_COLUMN.key) {
      return (
        <Command
          render={<div />}
          tabIndex={0}
          title={profile.name}
          className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:outline-none"
          onClick={() => aiProfileFormService.open(profile.id, profile.name)}
        >
          <Link truncate>{profile.name}</Link>
          {isDefault && (
            <span className="tw:text-xs tw:opacity-60 tw:whitespace-nowrap">{translate('plugin_ai_administration_profile_default_badge')}</span>
          )}
        </Command>
      );
    }

    if (column.key === ENGINE_COLUMN.key) {
      const engine = enginesLoader.data.find(engine => engine.id === profile.engineId);
      const title = engine?.name ?? profile.engineId;

      if (engine?.icon) {
        return (
          <div title={title} className="tw:flex tw:gap-2">
            <IconOrImage icon={engine.icon} />
            <span className="tw:truncate">{title}</span>
          </div>
        );
      }

      return <span title={title}>{title}</span>;
    }

    return null;
  }

  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    COLUMNS,
    profiles,
    defaultProfileId,
    aiProfileFormService,
    enginesLoader.data,
  ]);

  function getHeaderText(colIdx: number) {
    return translate(COLUMNS[colIdx]?.label) ?? '';
  }

  function getHeaderElement(colIdx: number) {
    if (colIdx === 0) {
      return <TableRowSelect isRoot />;
    }

    return getHeaderText(colIdx);
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [COLUMNS, translate],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    COLUMNS,
    translate,
  ]);

  if (!profiles.length) {
    return <TextPlaceholder>{translate('plugin_ai_administration_profiles_table_empty_placeholder')}</TextPlaceholder>;
  }

  return (
    <div className="tw:overflow-auto tw:h-full tw:max-w-full theme-text-on-surface">
      <DataGrid
        columnCount={columnsCount}
        rowCount={rowsCount}
        getHeaderResizable={colIdx => colIdx > 0}
        getRowHeight={() => ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT}
        getHeaderPinned={colIdx => colIdx <= 0}
        headerText={headerText}
        headerElement={headerElement}
        cell={cell}
        className={s(styles, { table: true })}
      />
    </div>
  );
});
