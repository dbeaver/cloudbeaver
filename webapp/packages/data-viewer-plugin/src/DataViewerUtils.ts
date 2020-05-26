import { IColumnSorting } from '@dbeaver/ag-grid-plugin';
import { SqlDataFilterConstraint } from '@dbeaver/core/sdk';

import { IRequestDataResultOptions } from './TableViewer/TableViewerModel';

export function RequestDataOptionsToConstrains(
  options?: IRequestDataResultOptions
): SqlDataFilterConstraint[] | undefined {
  const constraints: SqlDataFilterConstraint[] = (options?.sorting || [])
    .reduce((accumulator: SqlDataFilterConstraint[], columnSorting: IColumnSorting) => {
      if (columnSorting.sortMode) {
        const constrain: SqlDataFilterConstraint = {
          attribute: columnSorting.colId,
          orderPosition: columnSorting.sortOrder || 0,
          orderAsc: columnSorting.sortMode === 'asc',
        };
        accumulator.push(constrain);
      }
      return accumulator;
    }, []);
  constraints.sort((a, b) => a.orderPosition! - b.orderPosition!);
  constraints.forEach((c, ind) => c.orderPosition = ind);

  return constraints.length ? constraints : undefined;
}
