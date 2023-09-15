/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { forwardRef, useContext } from 'react';

import { s } from '../../s';
import { useS } from '../../useS';
import { TreeNodeContext } from './TreeNodeContext';
import style from './TreeNodeNested.m.css';

interface Props extends React.PropsWithChildren {
  expanded?: boolean;
  root?: boolean;
  big?: boolean;
  className?: string;
}

export const TreeNodeNested = forwardRef<HTMLDivElement, Props>(function TreeNodeNested({ root, big, className, children }, ref) {
  const styles = useS(style);
  const context = useContext(TreeNodeContext);
  const expanded = context?.expanded ?? false;

  return (
    <div ref={ref} className={s(styles, { treeNodeNested: true, root, expanded, big }, className)}>
      {children}
    </div>
  );
});
