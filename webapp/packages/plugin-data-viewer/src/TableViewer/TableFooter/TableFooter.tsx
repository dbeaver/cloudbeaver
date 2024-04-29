/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Form, getComputed, s, ToolsPanel, useS } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';

import { ResultSetConstraintAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetConstraintAction';
import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import { DataViewerSettingsService } from '../../DataViewerSettingsService';
import { AutoRefreshButton } from './AutoRefresh/AutoRefreshButton';
import styles from './TableFooter.m.css';
import { TableFooterMenu } from './TableFooterMenu/TableFooterMenu';
import { TableFooterRowCount } from './TableFooterRowCount';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, any>;
  simple: boolean;
  context?: IDataContext;
}

export const TableFooter = observer<Props>(function TableFooter({ resultIndex, model, simple, context }) {
  const ref = useRef<HTMLInputElement>(null);
  const [limit, setLimit] = useState(model.countGain + '');
  const dataViewerSettingsService = useService(DataViewerSettingsService);
  const style = useS(styles);

  const handleChange = useCallback(async () => {
    if (!ref.current) {
      return;
    }

    const value = dataViewerSettingsService.getDefaultRowsCount(parseInt(ref.current.value, 10));

    setLimit(value + '');
    if (model.countGain !== value) {
      await model.setCountGain(value).reload();
    }
  }, [model]);

  useEffect(() => {
    if (limit !== model.countGain + '') {
      setLimit(model.countGain + '');
    }
  }, [model.countGain]);

  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex));
  const constraint = model.getResult(resultIndex) ? model.source.getAction(resultIndex, ResultSetConstraintAction) : null;

  return (
    <ToolsPanel type="secondary" center>
      <AutoRefreshButton model={model} disabled={disabled} />
      <div className={s(style, { count: true })}>
        <Form onSubmit={handleChange}>
          <input
            ref={ref}
            className={s(style, { input: true })}
            type="number"
            value={limit}
            disabled={disabled}
            min={dataViewerSettingsService.minFetchSize}
            max={dataViewerSettingsService.maxFetchSize}
            onChange={e => setLimit(e.target.value)}
            onBlur={handleChange}
          />
        </Form>
      </div>
      {constraint?.supported && <TableFooterRowCount model={model} resultIndex={resultIndex} />}
      <TableFooterMenu model={model} resultIndex={resultIndex} simple={simple} context={context} />
      {model.source.requestInfo.requestMessage.length > 0 && (
        <div className={s(style, { time: true })}>
          {model.source.requestInfo.requestMessage} - {model.source.requestInfo.requestDuration}ms
        </div>
      )}
    </ToolsPanel>
  );
});
