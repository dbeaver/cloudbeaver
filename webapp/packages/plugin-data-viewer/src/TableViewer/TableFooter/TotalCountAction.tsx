/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { getComputed, s, ToolsAction, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import TableFooterMenuStyles from './TableFooterMenu/TableFooterMenuItem.m.css';
import classes from './TableFooterRowCount.m.css';

interface Props {
  onClick: VoidFunction;
  loading: boolean;
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export const TotalCountAction = observer<Props>(function TotalCountAction({ onClick, loading, resultIndex, model }) {
  const result = model.getResult(resultIndex);
  const translate = useTranslate();
  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex));
  const style = useS(TableFooterMenuStyles, classes);

  if (!result) {
    return null;
  }

  const currentCount = result.loadedFully ? result.count : `${result.count}+`;
  const count = result.totalCount ?? currentCount;

  return (
    <div className={s(style, { wrapper: true })} title={translate('data_viewer_total_count_tooltip')}>
      <ToolsAction
        className={s(style, { toolsAction: true })}
        disabled={disabled}
        loading={loading}
        icon="/icons/data_row_count.svg"
        viewBox="0 0 32 32"
        onClick={onClick}
      >
        <span>{count}</span>
      </ToolsAction>
    </div>
  );
});
