/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import style from './TreeNodeName.module.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const TreeNodeName: React.FC<Props> = observer(function TreeNodeName({ className, children, ...rest }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { treeNodeName: true }, className)} {...rest}>
      {children}
    </div>
  );
});
