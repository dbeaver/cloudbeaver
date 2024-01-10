/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../../s';
import { useS } from '../../useS';
import style from './TreeNodeNestedMessage.m.css';

interface Props {
  className?: string;
}

export const TreeNodeNestedMessage: React.FC<React.PropsWithChildren<Props>> = observer(function TreeNodeNestedMessage({ className, children }) {
  const styles = useS(style);
  return <div className={s(styles, { treeNodeNestedMessage: true }, className)}>{children}</div>;
});
