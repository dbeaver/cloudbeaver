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

import { IconOrImage, Link, s, TextPlaceholder, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { DataGrid, TableRowSelect, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';
import { Command } from '@dbeaver/ui-kit';

import { AI_PROFILES_TABLE_ROW_HEIGHT } from './AI_PROFILES_TABLE_ROW_HEIGHT.js';
import type { AIProfile } from './AIProfilesResource.js';
import AIProfilesTableStyles from './AIProfilesTable.module.css';

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
  getProfileBadge?: (profile: AIProfile) => ReactNode;
  onProfileClick?: (profile: AIProfile) => void;
}

const SELECT_COLUMN = { key: 'select', label: '' };
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
  getProfileBadge,
  onProfileClick,
}) {
  const translate = useTranslate();
  const styles = useS(AIProfilesTableStyles);
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
          <span>{translate(profile.global ? 'plugin_ai_profiles_scope_global' : 'plugin_ai_profiles_scope_user')}</span>
          {profile.global && <IconOrImage icon="document-global" width={16} />}
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
      const content = (
        <>
          {clickable ? <Link truncate>{profile.name}</Link> : <span className="tw:truncate">{profile.name}</span>}
          {getProfileBadge?.(profile)}
        </>
      );

      if (clickable) {
        return (
          <Command
            render={<div />}
            tabIndex={0}
            title={profile.name}
            className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:outline-none"
            onClick={() => onProfileClick(profile)}
          >
            {content}
          </Command>
        );
      }

      return (
        <div title={profile.name} className="tw:flex tw:items-center tw:gap-2">
          {content}
        </div>
      );
    }

    if (column.key === ENGINE_COLUMN.key) {
      const engine = enginesLoader.data.find(engine => engine.id === profile.engineId);
      const title = engine?.name ?? profile.engineId;
      return (
        <div title={title} className="tw:flex tw:items-center tw:gap-2">
          <span className="tw:truncate">{title}</span>
          {engine?.icon && <IconOrImage icon={engine.icon} width={16} />}
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
    getProfileBadge,
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
    return columns[colIdx]?.width ?? null;
  }

  function getHeaderMinWidth(colIdx: number) {
    return columns[colIdx]?.minWidth ?? null;
  }

  return (
    <div className="tw:overflow-auto tw:h-full tw:max-w-full theme-text-on-surface">
      <DataGrid
        columnCount={columnCount}
        rowCount={rowCount}
        getHeaderResizable={colIdx => columns[colIdx]?.key !== SELECT_COLUMN.key}
        getRowHeight={() => AI_PROFILES_TABLE_ROW_HEIGHT}
        getHeaderPinned={colIdx => columns[colIdx]?.key === SELECT_COLUMN.key}
        headerText={headerText}
        headerElement={headerElement}
        getHeaderWidth={getHeaderWidth}
        getHeaderMinWidth={getHeaderMinWidth}
        cell={cell}
        className={s(styles, { table: true })}
      />
    </div>
  );
});
