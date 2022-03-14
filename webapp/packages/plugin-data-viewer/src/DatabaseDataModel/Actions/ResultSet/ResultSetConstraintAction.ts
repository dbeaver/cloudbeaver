/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable } from 'mobx';

import { DataTypeLogicalOperation, ResultDataFormat, SqlDataFilterConstraint } from '@cloudbeaver/core-sdk';

import { DatabaseDataAction } from '../../DatabaseDataAction';
import type { IDatabaseDataOptions } from '../../IDatabaseDataOptions';
import type { IDatabaseDataSource } from '../../IDatabaseDataSource';
import type { IDatabaseResultSet } from '../../IDatabaseResultSet';
import { EOrder, Order } from '../../Order';
import { databaseDataAction } from '../DatabaseDataActionDecorator';
import type { IDatabaseDataConstraintAction } from '../IDatabaseDataConstraintAction';

export const IS_NULL_ID = 'IS_NULL';
export const IS_NOT_NULL_ID = 'IS_NOT_NULL';

@databaseDataAction()
export class ResultSetConstraintAction extends DatabaseDataAction<IDatabaseDataOptions, IDatabaseResultSet>
  implements IDatabaseDataConstraintAction<IDatabaseResultSet> {
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

  constructor(source: IDatabaseDataSource<any, IDatabaseResultSet>, result: IDatabaseResultSet) {
    super(source, result);
    makeObservable(this, {
      orderConstraints: computed,
      filterConstraints: computed,
    });
  }

  private deleteConstraint(attributePosition: number) {
    if (!this.source.options) {
      return;
    }

    this.source.options.constraints = this.source.options.constraints
      .filter(constraint => constraint.attributePosition !== attributePosition);
  }

  private deleteEmptyConstraint(attributePosition: number) {
    const constraint = this.get(attributePosition);

    if (constraint && !isFilterConstraint(constraint) && !isOrderConstraint(constraint)) {
      this.deleteConstraint(attributePosition);
    }
  }

  private getMaxOrderPosition() {
    return Math.max(0, ...this.orderConstraints
      .map(constraint => constraint.orderPosition !== undefined ? constraint.orderPosition + 1 : -1));
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
    this.source.options.whereFilter = '';
  }

  deleteData(): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    this.deleteAll();
    this.source.options.whereFilter = '';
  }

  setFilter(attributePosition: number, operator: string, value?: any): void {
    if (!this.source.options) {
      throw new Error('Options must be provided');
    }

    const currentConstraint = this.get(attributePosition);

    if (currentConstraint) {
      currentConstraint.operator = operator;
      if (value !== undefined) {
        currentConstraint.value = value;
      } else if (currentConstraint.value !== undefined) {
        delete currentConstraint.value;
      }
      return;
    }

    const constraint: SqlDataFilterConstraint = {
      attributePosition,
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
        this.deleteConstraint(currentConstraint.attributePosition);
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

  updateResults(results: IDatabaseResultSet[]): void {
    if (!this.source.options || results.length !== this.source.results.length) {
      return;
    }

    const nextResult = results[this.resultIndex];

    for (const constraint of this.source.options.constraints) {
      const prevColumn = this.result.data?.columns?.find(column => column.position === constraint.attributePosition);

      if (!prevColumn) {
        return;
      }

      let column = nextResult.data?.columns?.find(column => column.position === prevColumn.position);

      if (!column || column.label !== prevColumn.label) {
        column = nextResult.data?.columns?.find(column => column.label === prevColumn.label);
      }

      if (column && prevColumn.position !== column.position) {
        const prevConstraint = this.source.prevOptions?.constraints
          .find(prevConstraint => prevConstraint.attributePosition === constraint.attributePosition);

        constraint.attributePosition = column.position;

        if (prevConstraint) {
          prevConstraint.attributePosition = constraint.attributePosition;
        }
      }
    }
  }
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
