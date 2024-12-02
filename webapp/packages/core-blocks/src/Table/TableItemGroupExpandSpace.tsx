/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './TableItemGroupExpand.module.css';

export interface TableItemGroupExpandSpaceProps {
  className?: string;
}

export const TableItemGroupExpandSpaceSpace = observer<TableItemGroupExpandSpaceProps>(function TableItemGroupExpandSpaceSpace({ className }) {
  const styles = useS(classes);

  return <div className={s(styles, { box: true }, className)} />;
});
