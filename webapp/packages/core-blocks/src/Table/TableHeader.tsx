/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import style from './TableHeader.m.css';

interface Props {
  fixed?: boolean;
  className?: string;
}

export const TableHeader: React.FC<React.PropsWithChildren<Props>> = function TableHeader({ fixed, children, className }) {
  const styles = useS(style);

  return (
    <thead className={s(styles, { fixed, tableHeader: true }, className)}>
      <tr>{children}</tr>
    </thead>
  );
};
