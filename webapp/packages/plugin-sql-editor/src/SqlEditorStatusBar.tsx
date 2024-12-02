/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, useS } from '@cloudbeaver/core-blocks';

import type { ISqlDataSource } from './SqlDataSource/ISqlDataSource.js';
import classes from './SqlEditorStatusBar.module.css';

interface Props {
  dataSource: ISqlDataSource | undefined;
}

export const SqlEditorStatusBar = observer<Props>(function SqlEditorStatusBar({ dataSource }) {
  const styles = useS(classes);
  return <Loader className={s(styles, { loader: true })} state={dataSource} message={dataSource?.message} inline inlineException />;
});
