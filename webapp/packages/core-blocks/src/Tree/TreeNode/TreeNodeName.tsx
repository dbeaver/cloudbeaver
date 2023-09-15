/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../../s';
import { useS } from '../../useS';
import style from './TreeNodeName.m.css';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  big?: boolean;
  className?: string;
}

export const TreeNodeName: React.FC<Props> = function TreeNodeName({ big, className, children, ...rest }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { treeNodeName: true, big }, className)} {...rest}>
      {children}
    </div>
  );
};
