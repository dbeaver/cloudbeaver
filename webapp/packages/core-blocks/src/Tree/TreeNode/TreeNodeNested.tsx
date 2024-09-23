/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef } from 'react';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import style from './TreeNodeNested.module.css';

interface Props extends React.PropsWithChildren {
  root?: boolean;
  className?: string;
}

export const TreeNodeNested = observer(
  forwardRef<HTMLDivElement, Props>(function TreeNodeNested({ root, className, children }, ref) {
    const styles = useS(style);

    return (
      <div ref={ref} className={s(styles, { treeNodeNested: true, root }, className)}>
        {children}
      </div>
    );
  }),
);
