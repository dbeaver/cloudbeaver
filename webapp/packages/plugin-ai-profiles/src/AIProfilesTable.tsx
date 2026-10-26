/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction } from 'mobx';
import { observer } from 'mobx-react-lite';
import type { ReactNode } from 'react';

import { IconOrImage, s, TextPlaceholder, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import {
  ADMINISTRATION_TABLE_DEFAULT_HEADER_HEIGHT,
  ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT,
  ADMINISTRATION_TABLE_DEFAULT_SELECTION_COLUMN_WIDTH,
  AdministrationTable,
  AdministrationTableStyles,
} from '@cloudbeaver/core-administration';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { DataGrid, TableRowSelect, useCellCopy, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';

import type { AIProfile } from './AIProfilesResource.js';
import { AIProfileNameCell } from './AIProfileNameCell.js';

export interface IAIProfilesTableColumn {
  key: string;
  label: string;
  width?: number | string;
  minWidth?: number;
  render: (profile: AIProfile) => ReactNode;
}

type TableColumn = Omit<IAIProfilesTableColumn, 'render'> & { render?: IAIProfilesTableColumn['render'] };

export interface IAIProfilesTableProps {
  profiles: AIProfile[];
  nameLabel: string;
  engineLabel: string;
  emptyPlaceholder: string;
  additionalColumns?: IAIProfilesTableColumn[];
  selectionDisabled?: boolean;
  isProfileSelectable?: (profile: AIProfile) => boolean;
  getSelectionTitle?: (profile: AIProfile) => string | undefined;
  isProfileClickable?: (profile: AIProfile) => boolean;
  isProfileDeletable?: (profile: AIProfile) => boolean;
  getProfileBadge?: (profile: AIProfile) => ReactNode;
  processing?: boolean;
  onClone?: (profileId: string) => void;
  onDelete?: (profileId: string) => void;
  onProfileClick?: (profile: AIProfile) => void;
}

const SELECT_COLUMN = { key: 'select', label: '', width: ADMINISTRATION_TABLE_DEFAULT_SELECTION_COLUMN_WIDTH };
const NAME_COLUMN = { key: 'name', minWidth: 160 };
const ENGINE_COLUMN = { key: 'engine', width: 160 };
const SCOPE_COLUMN = { key: 'scope', width: 120 };

export const AIProfilesTable = observer<IAIProfilesTableProps>(function AIProfilesTable({
  profiles,
  nameLabel,
  engineLabel,
  emptyPlaceholder,
  additionalColumns = [],
  selectionDisabled,
  isProfileSelectable,
  getSelectionTitle,
  isProfileClickable,
  isProfileDeletable,
  getProfileBadge,
  processing,
  onClone,
  onDelete,
  onProfileClick,
}) {
  const translate = useTranslate();
  const styles = useS(AdministrationTableStyles);
  const cellCopy = useCellCopy();
  const enginesLoader = useResource(AIProfilesTable, AiEnginesResource, undefined);
  const selectable = !!isProfileSelectable;
  const columns: TableColumn[] = [
    ...(selectable ? [SELECT_COLUMN] : []),
    { ...NAME_COLUMN, label: nameLabel },
    { ...ENGINE_COLUMN, label: engineLabel },
    {
      ...SCOPE_COLUMN,
      label: 'plugin_ai_profiles_scope',
      render: profile => (
        <div className="tw:flex tw:items-center tw:gap-2">
          {profile.global && <IconOrImage icon="document-global" width={16} />}
          <span>{translate(profile.global ? 'plugin_ai_profiles_scope_global' : 'plugin_ai_profiles_scope_user')}</span>
        </div>
      ),
    },
    ...additionalColumns,
  ];

  const columnCount = useCreateGridReactiveValue(() => columns.length, null, [columns]);
  const rowCount = useCreateGridReactiveValue(
    () => profiles.length,
    onValueChange => reaction(() => profiles.length, onValueChange),
    [profiles],
  );

  function getCell(rowIdx: number, colIdx: number) {
    const profile = profiles[rowIdx];
    const column = columns[colIdx];
    if (!profile || !column) {
      return null;
    }

    if (column.key === SELECT_COLUMN.key) {
      return <TableRowSelect id={profile.id} disabled={selectionDisabled || !isProfileSelectable?.(profile)} title={getSelectionTitle?.(profile)} />;
    }

    if (column.key === NAME_COLUMN.key) {
      const clickable = !!onProfileClick && (isProfileClickable?.(profile) ?? true);
      return (
        <AIProfileNameCell
          profile={profile}
          badge={getProfileBadge?.(profile)}
          disabled={processing}
          deletionDisabled={!(isProfileDeletable?.(profile) ?? true)}
          onOpen={clickable ? onProfileClick : undefined}
          onClone={onClone}
          onDelete={onDelete}
        />
      );
    }

    if (column.key === ENGINE_COLUMN.key) {
      const engine = enginesLoader.data.find(engine => engine.id === profile.engineId);
      const title = engine?.name ?? profile.engineId;
      return (
        <div title={title} className="tw:flex tw:items-center tw:gap-2">
          {engine?.icon && <IconOrImage icon={engine.icon} width={16} />}
          <span className="tw:truncate">{title}</span>
        </div>
      );
    }

    return column.render?.(profile) ?? null;
  }

  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    profiles,
    columns,
    enginesLoader.data,
    additionalColumns,
    selectionDisabled,
    isProfileSelectable,
    getSelectionTitle,
    isProfileClickable,
    isProfileDeletable,
    getProfileBadge,
    processing,
    onClone,
    onDelete,
    onProfileClick,
  ]);

  function getHeaderText(colIdx: number) {
    return translate(columns[colIdx]?.label) ?? '';
  }

  function getHeaderElement(colIdx: number) {
    if (columns[colIdx]?.key === SELECT_COLUMN.key) {
      return <TableRowSelect isRoot />;
    }
    return getHeaderText(colIdx);
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [columns, translate],
  );
  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    columns,
    translate,
  ]);

  if (!profiles.length) {
    return <TextPlaceholder>{translate(emptyPlaceholder)}</TextPlaceholder>;
  }

  function getHeaderWidth(colIdx: number) {
    return columns[colIdx]?.width ?? 'auto';
  }

  function getHeaderMinWidth(colIdx: number) {
    return columns[colIdx]?.minWidth ?? null;
  }

  return (
    <AdministrationTable>
      <DataGrid
        columnCount={columnCount}
        rowCount={rowCount}
        getHeaderResizable={colIdx => columns[colIdx]?.key !== SELECT_COLUMN.key}
        getHeaderHeight={() => ADMINISTRATION_TABLE_DEFAULT_HEADER_HEIGHT}
        getRowHeight={() => ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT}
        getHeaderPinned={colIdx => columns[colIdx]?.key === SELECT_COLUMN.key}
        headerText={headerText}
        headerElement={headerElement}
        getHeaderWidth={getHeaderWidth}
        getHeaderMinWidth={getHeaderMinWidth}
        cell={cell}
        className={s(styles, { table: true })}
        onCellKeyDown={cellCopy.handleKeyDown}
      />
    </AdministrationTable>
  );
});
