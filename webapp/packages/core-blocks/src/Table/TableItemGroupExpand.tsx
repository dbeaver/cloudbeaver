/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { Icon } from '../Icon.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import { TableItemGroupContext } from './TableItemGroupContext.js';
import classes from './TableItemGroupExpand.module.css';

export interface TableItemGroupExpandProps {
  className?: string;
}

export const TableItemGroupExpand = observer<TableItemGroupExpandProps>(function TableItemGroupExpand({ className }) {
  const context = useContext(TableItemGroupContext);
  const styles = useS(classes);

  if (!context) {
    throw new Error('TableItemGroupExpand can be used only inside TableItemGroup');
  }

  function handleClick() {
    context!.setExpanded(!context!.expanded);
  }

  return (
    <div className={s(styles, { box: true }, className)}>
      <Icon className={s(styles, { icon: true, expanded: context.expanded })} name="arrow" viewBox="0 0 16 16" onClick={handleClick} />
    </div>
  );
});
