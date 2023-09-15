/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../../s';
import { useS } from '../../useS';
import style from './TreeNodeNestedMessage.m.css';

interface Props {
  big?: boolean;
  className?: string;
}

export const TreeNodeNestedMessage: React.FC<React.PropsWithChildren<Props>> = function TreeNodeNestedMessage({ big, className, children }) {
  const styles = useS(style);
  return <div className={s(styles, { treeNodeNestedMessage: true, big }, className)}>{children}</div>;
};
