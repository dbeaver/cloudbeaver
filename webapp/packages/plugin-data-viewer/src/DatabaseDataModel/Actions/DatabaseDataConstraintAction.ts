/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, computed, makeObservable, runInAction, untracked } from 'mobx';

import { schema } from '@cloudbeaver/core-utils';
import { type DataTypeLogicalOperation, ResultDataFormat, type SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

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

export interface IPersistedConstraint {
  attributeName: string;
  operator?: string;
  value?: unknown;
  orderAsc?: boolean;
  orderPosition?: number;
}

const persistedConstraintSchema = schema.object({
  attributeName: schema.string().min(1),
  operator: schema.string().optional(),
  value: schema.unknown().optional(),
  orderAsc: schema.boolean().optional(),
  orderPosition: schema.number().optional(),
});

const dataFilterSliceSchema = schema.object({
  [CONSTRAINTS_KEY]: schema.array(persistedConstraintSchema),
  [WHERE_FILTER_KEY]: schema.string(),
});

function isDataFilterOptions(options: unknown): options is IDatabaseDataOptions {
  return !!options && typeof options === 'object' && CONSTRAINTS_KEY in options && WHERE_FILTER_KEY in options;
}

export function persistDataFilterConstraints(source: IDatabaseDataSource<any, IDatabaseResultSet>): void {
  const options = source.options;
  if (!isDataFilterOptions(options)) {
    return;
  }

  const columns = source.getResult(0)?.data?.columns;
  const resolveName = (position: number | undefined): string | undefined => {
    if (position === undefined) {
      return undefined;
    }
    return columns?.find(c => c.position === position)?.name;
  };

  const constraints: IPersistedConstraint[] = options.constraints
    .map(c => {
      const name = c.attributeName ?? resolveName(c.attributePosition);
      if (!name) {
        return null;
      }
      const persisted: IPersistedConstraint = { attributeName: name };
      if (isFilterConstraint(c)) {
        persisted.operator = c.operator;
        persisted.value = c.value;
      }
      if (isOrderConstraint(c)) {
        persisted.orderAsc = c.orderAsc;
        persisted.orderPosition = c.orderPosition;
      }
      return persisted;
    })
    .filter((c): c is IPersistedConstraint => c !== null);

  const whereFilter = options.whereFilter || '';

  untracked(() => {
    const ps = source.persistedState;
    const storedWhereFilter = ps.get<string>(WHERE_FILTER_KEY);
    const storedConstraints = ps.get<IPersistedConstraint[]>(CONSTRAINTS_KEY);

    if (storedWhereFilter === whereFilter && JSON.stringify(storedConstraints) === JSON.stringify(constraints)) {
      return;
    }

    ps.set(CONSTRAINTS_KEY, constraints);
    ps.set(WHERE_FILTER_KEY, whereFilter);
  });
}

export function applyPersistedDataFilterConstraints(source: IDatabaseDataSource<any, IDatabaseResultSet>): void {
  const options = source.options;
  if (!isDataFilterOptions(options)) {
    return;
  }

  const snapshot = {
    [CONSTRAINTS_KEY]: source.persistedState.get<unknown>(CONSTRAINTS_KEY),
    [WHERE_FILTER_KEY]: source.persistedState.get<unknown>(WHERE_FILTER_KEY),
  };

  const parsed = dataFilterSliceSchema.safeParse(snapshot);
  if (!parsed.success) {
    return;
  }

  runInAction(() => {
    options.constraints = parsed.data[CONSTRAINTS_KEY].map(c => ({
      attributeName: c.attributeName,
      operator: c.operator,
      value: c.value,
      orderAsc: c.orderAsc,
      orderPosition: c.orderPosition,
    }));
    options.whereFilter = parsed.data[WHERE_FILTER_KEY];
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

  setWhereFilter(value: string) {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.source.options.whereFilter = value;
  }

  resetWhereFilter() {
    this.setWhereFilter('');
  }

  setFilter(attributePosition: number, operator: string, value?: any): void {
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

  runInAction(() => {
    for (const constraint of source.options!.constraints) {
      let prevColumn = result.data?.columns?.find(c => c.position === constraint.attributePosition);

      if (!prevColumn && constraint.attributeName) {
        prevColumn = result.data?.columns?.find(c => c.name === constraint.attributeName);

        if (prevColumn) {
          constraint.attributePosition = prevColumn.position;
        }
      }

      if (!prevColumn) {
        continue;
      }

      let column = result.data?.columns?.find(c => c.position === prevColumn.position);

      if (!column || column.label !== prevColumn.label) {
        column = result.data?.columns?.find(c => c.label === prevColumn.label);
      }

      if (column && prevColumn.position !== column.position) {
        const prevConstraint = source.prevOptions?.constraints.find(
          prevConstraint => prevConstraint.attributePosition === constraint.attributePosition,
        );

        constraint.attributePosition = column.position;

        if (prevConstraint) {
          prevConstraint.attributePosition = constraint.attributePosition;
        }
      }
    }
  });
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

export function wrapOperationArgument(operationId: string, argument: any): string {
  if (operationId === 'LIKE') {
    return `%${argument}%`;
  }

  return argument;
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
