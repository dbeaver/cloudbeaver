/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useEffect, useRef, useState } from 'react';

import { Container, Form, getComputed, s, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ICustomMenuItemComponent } from '@cloudbeaver/core-view';

import { DATA_CONTEXT_DV_DDM } from '../../../../DatabaseDataModel/DataContext/DATA_CONTEXT_DV_DDM.js';
import { DataViewerSettingsService } from '../../../../DataViewerSettingsService.js';
import styles from './FetchSizeAction.module.css';

export const FetchSizeAction: ICustomMenuItemComponent = observer(function FetchSizeAction({ context }) {
  const model = context.get(DATA_CONTEXT_DV_DDM)!;
  const ref = useRef<HTMLInputElement>(null);
  const [limit, setLimit] = useState(model.countGain + '');
  const dataViewerSettingsService = useService(DataViewerSettingsService);
  const style = useS(styles);

  async function handleChange() {
    if (!ref.current) {
      return;
    }

    const value = dataViewerSettingsService.getDefaultRowsCount(parseInt(ref.current.value, 10));

    setLimit(value + '');
    if (model.countGain !== value) {
      await model.setCountGain(value).reload();
    }
  }

  useEffect(() => {
    if (limit !== model.countGain + '') {
      setLimit(model.countGain + '');
    }
  }, [model.countGain]);

  const disabled = getComputed(() => model.isLoading());

  return (
    <Container className={s(style, { count: true })} keepSize noGrow center>
      <Form contents onSubmit={handleChange}>
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
    </Container>
  );
});
