/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataOptions } from '../../IDatabaseDataOptions';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataSortAction } from '../IDatabaseDataSortAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

export enum ESortMode {
  'asc' = 'asc',
  'desc' = 'desc'
}

export type SortMode = ESortMode | null;

@databaseDataAction()
export class ResultSetSortAction extends DatabaseDataAction<IDatabaseDataOptions, IDatabaseResultSet>
  implements IDatabaseDataSortAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

  private clear() {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = [];
  }

  private deleteConstraint(columnName: string) {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = this.source.options.constraints
      .filter(constraint => constraint.attribute !== columnName);
  }

  private reorderConstraints() {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = this.source.options.constraints
      .map((constaint, idx) => ({ ...constaint, orderPosition: idx }));
  }

  getSortingConstraints() {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints
      .filter(constraint => constraint.orderAsc !== undefined);
  }

  removeSortingConstraints() {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.source.options.constraints = this.source.options.constraints
      .filter(constaint => constaint.orderAsc === undefined);
  }

  setSortMode(columnName: string, sortMode: SortMode, multiple: boolean): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const resetSortMode = sortMode === null;
    const currentConstraint = this.source.options.constraints.find(constraint => constraint.attribute === columnName);

    if (currentConstraint && multiple) {
      if (resetSortMode) {
        this.deleteConstraint(currentConstraint.attribute);
        this.reorderConstraints();
      } else {
        currentConstraint.orderAsc = sortMode === ESortMode.asc;
      }
      return;
    }

    if (!multiple) {
      this.clear();
    }

    if (!resetSortMode) {
      this.source.options.constraints.push({
        attribute: columnName,
        orderPosition: this.source.options.constraints.length,
        orderAsc: sortMode === ESortMode.asc,
      });
    }
  }

  getSortMode(columnName: string): SortMode {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.source.options.constraints.find(constraint => constraint.attribute === columnName);

    if (!currentConstraint) {
      return null;
    }

    return currentConstraint.orderAsc ? ESortMode.asc : ESortMode.desc;
  }
}

export function getNextSortMode(sortMode: SortMode): SortMode {
  switch (sortMode) {
    case ESortMode.asc:
      return ESortMode.desc;
    case ESortMode.desc:
      return null;
    default:
      return ESortMode.asc;
  }
}
