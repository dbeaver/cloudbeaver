/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import tableStyles from './Table.m.css';
import style from './TableColumnHeader.m.css';

interface Props {
  title?: string;
  min?: boolean;
  flex?: boolean;
  heightBig?: boolean;
  centerContent?: boolean;
  className?: string;
}

export const TableColumnHeader: React.FC<React.PropsWithChildren<Props>> = function TableColumnHeader({
  title,
  min,
  heightBig,
  flex,
  centerContent,
  className,
  children,
}) {
  const styles = useS(style, tableStyles);

  return (
    <th title={title} className={s(styles, { min, heightBig, centerContent, columnHeader: true }, className)}>
      {flex ? <div className={s(styles, { thFlex: true }, className)}>{children}</div> : children}
    </th>
  );
};
