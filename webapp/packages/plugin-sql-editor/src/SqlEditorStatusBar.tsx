/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Alert, Loader, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';
import classes from './SqlEditorStatusBar.module.css';

interface Props {
  dataSource: ISqlDataSource | undefined;
}

export const SqlEditorStatusBar = observer<Props>(function SqlEditorStatusBar({ dataSource }) {
  const styles = useS(classes);
  const t = useTranslate();
  return (
    <Loader
      className={s(styles, { statusPosition: true, loader: true })}
      state={dataSource}
      message={dataSource?.loadingMessage}
      inline
      inlineException
    >
      {dataSource?.message && (
        <div className={s(styles, { statusPosition: true }, 'tw:p-2')}>
          <Alert title={t(dataSource.message)} />
        </div>
      )}
    </Loader>
  );
});
