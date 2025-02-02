/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';

import { type InputAutocompleteProposal, useObservableRef } from '@cloudbeaver/core-blocks';
import type { SqlResultColumn } from '@cloudbeaver/core-sdk';

import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel.js';
import { isResultSetDataModel } from '../../ResultSet/isResultSetDataModel.js';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
}

interface IState {
  readonly columns: SqlResultColumn[];
  readonly hintProposals: InputAutocompleteProposal[];
}

const BASE_HINTS: InputAutocompleteProposal[] = [
  {
    displayString: 'AND',
    replacementString: 'AND',
  },
  {
    displayString: 'OR',
    replacementString: 'OR',
  },
  {
    displayString: 'ILIKE',
    replacementString: 'ILIKE',
  },
  {
    displayString: 'LIKE',
    replacementString: 'LIKE',
  },
  {
    displayString: 'IN',
    replacementString: 'IN',
  },
  {
    displayString: 'BETWEEN',
    replacementString: 'BETWEEN',
  },
  {
    displayString: 'IS',
    replacementString: 'IS',
  },
  {
    displayString: 'NOT',
    replacementString: 'NOT',
  },
  {
    displayString: 'NULL',
    replacementString: 'NULL',
  },
];

export function useTableViewerHeaderData({ model, resultIndex }: Props): Readonly<IState> {
  return useObservableRef(
    () => ({
      get columns() {
        const model = this.model as any;

        if (!model.source.hasResult(this.resultIndex) || !isResultSetDataModel(model)) {
          return [];
        }

        const view = model.source.tryGetAction(resultIndex, ResultSetViewAction);

        if (!view) {
          return [];
        }

        return view?.columns ?? [];
      },
      get hintProposals() {
        return [...BASE_HINTS].concat(
          this.columns.map(column => ({
            title: column.label || '',
            displayString: column.label || '',
            replacementString: column.label || '',
            icon: column.icon || '',
          })),
        );
      },
    }),
    {
      columns: computed,
      hintProposals: computed,
    },
    {
      resultIndex,
      model,
    },
  );
}
