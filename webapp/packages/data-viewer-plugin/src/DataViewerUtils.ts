import { SqlDataFilterConstraint } from '@dbeaver/core/sdk';

import { IRequestDataResultOptions } from './TableViewer/TableViewerModel';

export function RequestDataOptionsToConstrains(
  options?: IRequestDataResultOptions
): SqlDataFilterConstraint[] | undefined {
  const constraints: SqlDataFilterConstraint[] = (options?.sorting || [])
    .map((columnSorting, index) => {
      const constrain: SqlDataFilterConstraint = {
        attribute: columnSorting.colId,
        orderPosition: index,
        orderAsc: columnSorting.sort === 'asc',
      };
      return constrain;
    });

  return constraints.length ? constraints : undefined;
}
