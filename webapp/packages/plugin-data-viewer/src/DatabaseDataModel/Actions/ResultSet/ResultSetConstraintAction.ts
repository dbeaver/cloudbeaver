/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DataTypeLogicalOperation, ResultDataFormat, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataOptions } from '../../IDatabaseDataOptions';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import { ESortMode, IDatabaseDataConstraintAction, SortMode } from '../IDatabaseDataConstraintAction';
import type { IResultSetElementKey } from './IResultSetElementKey';

export const IS_NULL_ID = 'IS_NULL';
export const IS_NOT_NULL_ID = 'IS_NOT_NULL';

@databaseDataAction()
export class ResultSetConstraintAction extends DatabaseDataAction<IDatabaseDataOptions, IDatabaseResultSet>
  implements IDatabaseDataConstraintAction<IResultSetElementKey, IDatabaseResultSet> {
  static dataFormat = ResultDataFormat.Resultset;

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

  deleteAllConstraints(): void {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = [];
  }

  setFilter(columnName: string, operator: string, value?: any): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.source.options.constraints.find(constaint => constaint.attribute === columnName);

    if (currentConstraint) {
      currentConstraint.operator = operator;
      if (value !== undefined) {
        currentConstraint.value = value;
      }
      if (currentConstraint.value !== undefined && value === undefined) {
        delete currentConstraint.value;
      }
      return;
    }

    const constraint: SqlDataFilterConstraint = {
      attribute: columnName,
      operator,
      orderPosition: this.source.options.constraints.length,
    };

    if (value !== undefined) {
      constraint.value = value;
    }

    this.source.options.constraints.push(constraint);
  }

  deleteFilter(columnName: string): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.source.options.constraints.find(constaint => constaint.attribute === columnName);

    if (!currentConstraint) {
      return;
    }

    if (isConstraintContainsSorting(currentConstraint)) {
      deleteFilterFromConstraint(currentConstraint);
    } else {
      this.deleteConstraint(columnName);
      this.reorderConstraints();
    }
  }

  getFilter(columnName: string): SqlDataFilterConstraint | null {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.source.options.constraints.find(constaint => constaint.attribute === columnName);

    if (!currentConstraint || (currentConstraint && !isConstraintContainsFilter(currentConstraint))) {
      return null;
    }

    return currentConstraint;
  }

  getFilterConstraints(): SqlDataFilterConstraint[] {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints.filter(isConstraintContainsFilter);
  }

  deleteFiltersFromConstraints(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    let reorderNeeded = false;

    this.source.options.constraints = this.source.options.constraints.reduce((acc: SqlDataFilterConstraint[], curr) => {
      if (isConstraintContainsSorting(curr)) {
        deleteFilterFromConstraint(curr);
        return [...acc, curr];
      }
      reorderNeeded = true;
      return acc;
    }, []);

    if (reorderNeeded) {
      this.reorderConstraints();
    }
  }

  deleteSortingFromConstraints(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    let reorderNeeded = false;

    this.source.options.constraints = this.source.options.constraints.reduce((acc: SqlDataFilterConstraint[], curr) => {
      if (isConstraintContainsFilter(curr)) {
        deleteSortingFromConstraint(curr);
        return [...acc, curr];
      }
      reorderNeeded = true;
      return acc;
    }, []);

    if (reorderNeeded) {
      this.reorderConstraints();
    }
  }

  getSortingConstraints(): SqlDataFilterConstraint[] {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints.filter(isConstraintContainsSorting);
  }

  setSortMode(columnName: string, sortMode: SortMode, multiple: boolean): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const resetSortMode = sortMode === null;

    if (!multiple) {
      this.deleteSortingFromConstraints();
    }

    const currentConstraint = this.source.options.constraints.find(constraint => constraint.attribute === columnName);

    if (!currentConstraint) {
      if (!resetSortMode) {
        this.source.options.constraints.push({
          attribute: columnName,
          orderPosition: this.source.options.constraints.length,
          orderAsc: sortMode === ESortMode.asc,
        });
      }
      return;
    }

    if (!resetSortMode) {
      currentConstraint.orderAsc = sortMode === ESortMode.asc;
    } else {
      if (isConstraintContainsFilter(currentConstraint)) {
        deleteSortingFromConstraint(currentConstraint);
      } else {
        this.deleteConstraint(currentConstraint.attribute);
        this.reorderConstraints();
      }
    }
  }

  getSortMode(columnName: string): SortMode {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.source.options.constraints.find(constraint => constraint.attribute === columnName);

    if (!currentConstraint || (currentConstraint && !isConstraintContainsSorting(currentConstraint))) {
      return null;
    }

    return currentConstraint.orderAsc ? ESortMode.asc : ESortMode.desc;
  }
}

export function supportedOperationsFilter(operation: DataTypeLogicalOperation): boolean {
  return operation.argumentCount === 1 || operation.argumentCount === 0;
}

export function operationsWithNullFilter(operation: DataTypeLogicalOperation): boolean {
  return operation.id === IS_NULL_ID || operation.id === IS_NOT_NULL_ID;
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

export function getOperationWrappedValue(value: any, operationId: string): string {
  let result = value;
  if (operationId === 'LIKE') {
    result = `%${result} %`;
  }

  result = `'${result}'`;

  return result;
}

function isConstraintContainsFilter(constraint: SqlDataFilterConstraint) {
  return constraint.operator !== undefined;
}

function isConstraintContainsSorting(constraint: SqlDataFilterConstraint) {
  return constraint.orderAsc !== undefined;
}

function deleteSortingFromConstraint(constraint: SqlDataFilterConstraint) {
  delete constraint.orderAsc;
  return constraint;
}

function deleteFilterFromConstraint(constraint: SqlDataFilterConstraint) {
  delete constraint.operator;
  delete constraint.value;
  return constraint;
}
