/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, runInAction } from 'mobx';

import { type DataTypeLogicalOperation, ResultDataFormat, type SqlDataFilterConstraint, type SqlResultColumn } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../DatabaseDataAction.js';
import type { IDatabaseDataOptions } from '../IDatabaseDataOptions.js';
import { IDatabaseDataSource } from '../IDatabaseDataSource.js';
import type { IDatabaseResultSet } from '../IDatabaseResultSet.js';
import { EOrder, type Order } from '../Order.js';
import type { IDatabaseDataConstraintAction } from './IDatabaseDataConstraintAction.js';
import { injectable } from '@cloudbeaver/core-di';
import { IDatabaseDataResult } from '../IDatabaseDataResult.js';

export const IS_NULL_ID = 'IS_NULL';
export const IS_NOT_NULL_ID = 'IS_NOT_NULL';

const CONSTRAINTS_KEY = 'constraints';
const WHERE_FILTER_KEY = 'whereFilter';

export function persistDataFilterConstraints<TOptions extends IDatabaseDataOptions>(
  source: IDatabaseDataSource<TOptions, IDatabaseResultSet>,
): void {
  const options = source.options;
  if (!options) {
    return;
  }

  source.persistedState.set(CONSTRAINTS_KEY, options.constraints.filter(hasConstraintIdentity));
  source.persistedState.set(WHERE_FILTER_KEY, options.whereFilter || '');
}

export function applyPersistedDataFilterConstraints<TOptions extends IDatabaseDataOptions>(
  source: IDatabaseDataSource<TOptions, IDatabaseResultSet>,
): void {
  const options = source.options;
  if (!options) {
    return;
  }

  const constraints = source.persistedState.get<SqlDataFilterConstraint[]>(CONSTRAINTS_KEY);
  const whereFilter = source.persistedState.get<string>(WHERE_FILTER_KEY);

  if (!Array.isArray(constraints) || typeof whereFilter !== 'string') {
    return;
  }

  runInAction(() => {
    options.constraints = constraints.map(constraint => ({ ...constraint }));
    options.whereFilter = whereFilter;
  });
}

@injectable(() => [IDatabaseDataSource, IDatabaseDataResult])
export class DatabaseDataConstraintAction
  extends DatabaseDataAction<IDatabaseDataOptions, IDatabaseResultSet>
  implements IDatabaseDataConstraintAction<IDatabaseResultSet>
{
  static dataFormat = [ResultDataFormat.Resultset, ResultDataFormat.Document];

  get supported(): boolean {
    return this.source.constraintsAvailable && this.source.results.length < 2;
  }

  get orderConstraints(): SqlDataFilterConstraint[] {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints.filter(isOrderConstraint);
  }

  get filterConstraints(): SqlDataFilterConstraint[] {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints.filter(isFilterConstraint);
  }

  constructor(source: IDatabaseDataSource, result: IDatabaseDataResult) {
    super(source as unknown as IDatabaseDataSource<any, IDatabaseResultSet>, result as IDatabaseResultSet);
    updateConstraintsForResult(source as unknown as IDatabaseDataSource<any, IDatabaseResultSet>, result as IDatabaseResultSet);

    makeObservable(this, {
      orderConstraints: computed,
      filterConstraints: computed,
      deleteAll: action,
      deleteFilter: action,
      deleteFilters: action,
      deleteOrders: action,
      deleteOrder: action,
      deleteDataFilters: action,
      deleteData: action,
      setWhereFilter: action,
      setFilter: action,
      setOrder: action,
    });
  }

  private deleteConstraint(attributePosition: number) {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = this.source.options.constraints.filter(constraint => constraint.attributePosition !== attributePosition);
  }

  private deleteEmptyConstraint(attributePosition: number) {
    const constraint = this.get(attributePosition);

    if (constraint && !isFilterConstraint(constraint) && !isOrderConstraint(constraint)) {
      this.deleteConstraint(attributePosition);
    }
  }

  private getMaxOrderPosition() {
    return Math.max(0, ...this.orderConstraints.map(constraint => (constraint.orderPosition !== undefined ? constraint.orderPosition + 1 : -1)));
  }

  get(attributePosition: number): SqlDataFilterConstraint | undefined {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    return this.source.options.constraints.find(constraint => constraint.attributePosition === attributePosition);
  }

  deleteAll(): void {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = [];
  }

  deleteFilter(attributePosition: number): void {
    const constraint = this.get(attributePosition);
    if (constraint) {
      deleteLogicalOperationFromConstraint(constraint);
      this.deleteEmptyConstraint(attributePosition);
    }
  }

  deleteFilters(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const newConstraints: SqlDataFilterConstraint[] = [];

    for (const constraint of this.source.options.constraints) {
      deleteLogicalOperationFromConstraint(constraint);
      if (isOrderConstraint(constraint)) {
        newConstraints.push(constraint);
      }
    }

    this.source.options.constraints = newConstraints;
  }

  deleteOrders(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const newConstraints: SqlDataFilterConstraint[] = [];

    for (const constraint of this.source.options.constraints) {
      deleteOrderFromConstraint(constraint);
      if (isFilterConstraint(constraint)) {
        newConstraints.push(constraint);
      }
    }

    this.source.options.constraints = newConstraints;
  }

  deleteOrder(attributePosition: number): void {
    const constraint = this.get(attributePosition);
    if (constraint) {
      deleteOrderFromConstraint(constraint);
      this.deleteEmptyConstraint(attributePosition);
    }
  }

  deleteDataFilters(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.deleteFilters();
    this.resetWhereFilter();
  }

  deleteData(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.deleteAll();
    this.resetWhereFilter();
  }

  setWhereFilter(value: string): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.source.options.whereFilter = value;
  }

  resetWhereFilter(): void {
    this.setWhereFilter('');
  }

  setFilter(attributePosition: number, operator: string, value?: unknown): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.get(attributePosition);

    if (currentConstraint) {
      currentConstraint.operator = operator;
      currentConstraint.attributeName = this.getColumnNameAt(attributePosition);
      if (value !== undefined) {
        currentConstraint.value = value;
      } else if (currentConstraint.value !== undefined) {
        delete currentConstraint.value;
      }
      return;
    }

    const constraint: SqlDataFilterConstraint = {
      attributePosition,
      attributeName: this.getColumnNameAt(attributePosition),
      operator,
    };

    if (value !== undefined) {
      constraint.value = value;
    }

    this.source.options.constraints.push(constraint);
  }

  setOrder(attributePosition: number, order: Order, multiple: boolean): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const resetOrder = order === null;

    if (!multiple) {
      this.deleteOrders();
    }

    const currentConstraint = this.get(attributePosition);

    if (!currentConstraint) {
      if (!resetOrder) {
        this.source.options.constraints.push({
          attributePosition,
          attributeName: this.getColumnNameAt(attributePosition),
          orderPosition: this.getMaxOrderPosition(),
          orderAsc: order === EOrder.asc,
        });
      }
      return;
    }

    if (!resetOrder) {
      if (!isOrderConstraint(currentConstraint)) {
        currentConstraint.orderPosition = this.getMaxOrderPosition();
      }
      currentConstraint.orderAsc = order === EOrder.asc;
    } else {
      if (isFilterConstraint(currentConstraint)) {
        deleteOrderFromConstraint(currentConstraint);
      } else {
        this.deleteConstraint(currentConstraint.attributePosition!);
      }
    }
  }

  getOrder(attributePosition: number): Order {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.get(attributePosition);

    if (!currentConstraint || !isOrderConstraint(currentConstraint)) {
      return null;
    }

    return currentConstraint.orderAsc ? EOrder.asc : EOrder.desc;
  }

  override updateResult(result: IDatabaseResultSet): void {
    updateConstraintsForResult(this.source, result);
  }

  private getColumnNameAt(colIdx: number): string | undefined {
    return this.result.data?.columns?.find(c => c.position === colIdx)?.name;
  }
}

function updateConstraintsForResult(source: IDatabaseDataSource<IDatabaseDataOptions, IDatabaseResultSet>, result: IDatabaseResultSet) {
  if (!source.options) {
    return;
  }

  const columns = result.data?.columns ?? [];

  if (columns.length === 0) {
    return;
  }

  runInAction(() => {
    for (const constraint of source.options!.constraints) {
      if (!hasConstraintIdentity(constraint)) {
        resetDataFilterState(source);
        return;
      }

      const initialPosition = constraint.attributePosition;
      const initialName = constraint.attributeName;

      const resolvedColumn = resolveConstraintColumn(columns, initialName, initialPosition);

      if (!resolvedColumn) {
        resetDataFilterState(source);
        return;
      }

      constraint.attributeName = resolvedColumn.name;
      constraint.attributePosition = resolvedColumn.position;

      const prevConstraint = source.prevOptions?.constraints.find(
        prevConstraint => prevConstraint.attributePosition === initialPosition && prevConstraint.attributeName === initialName,
      );

      if (prevConstraint) {
        prevConstraint.attributeName = constraint.attributeName;
        prevConstraint.attributePosition = constraint.attributePosition;
      }
    }
  });
}

function resetDataFilterState(source: IDatabaseDataSource<IDatabaseDataOptions, IDatabaseResultSet>): void {
  source.options!.constraints = [];
  source.options!.whereFilter = '';
  source.persistedState.delete(CONSTRAINTS_KEY);
  source.persistedState.delete(WHERE_FILTER_KEY);
}

function resolveConstraintColumn(
  columns: SqlResultColumn[],
  attributeName: string,
  attributePosition: number,
): (SqlResultColumn & { name: string; position: number }) | undefined {
  return columns.find(
    (column): column is SqlResultColumn & { name: string; position: number } =>
      typeof column.name === 'string' && typeof column.position === 'number' && column.position === attributePosition && column.name === attributeName,
  );
}

function hasConstraintIdentity(
  constraint: SqlDataFilterConstraint,
): constraint is SqlDataFilterConstraint & { attributeName: string; attributePosition: number } {
  return typeof constraint.attributeName === 'string' && constraint.attributeName.length > 0 && typeof constraint.attributePosition === 'number';
}

export function nullOperationsFilter(operation: DataTypeLogicalOperation): boolean {
  return operation.id === IS_NULL_ID || operation.id === IS_NOT_NULL_ID;
}

export function getNextOrder(order: Order): Order {
  switch (order) {
    case EOrder.asc:
      return EOrder.desc;
    case EOrder.desc:
      return null;
    default:
      return EOrder.asc;
  }
}

export function wrapOperationArgument(operationId: string, argument: unknown): string {
  if (operationId === 'LIKE') {
    return `%${argument}%`;
  }

  return String(argument);
}

export function isFilterConstraint(constraint: SqlDataFilterConstraint): boolean {
  return constraint.operator !== undefined;
}

export function isOrderConstraint(constraint: SqlDataFilterConstraint): boolean {
  return constraint.orderAsc !== undefined;
}

function deleteOrderFromConstraint(constraint: SqlDataFilterConstraint) {
  delete constraint.orderAsc;
  delete constraint.orderPosition;
  return constraint;
}

function deleteLogicalOperationFromConstraint(constraint: SqlDataFilterConstraint) {
  delete constraint.operator;
  delete constraint.value;
  return constraint;
}
