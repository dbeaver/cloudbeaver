/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s';
import { useS } from '../useS';
import style from './ItemList.m.css';

interface Props {
  onClick: () => void;
  className?: string;
}

export const ListItem: React.FC<React.PropsWithChildren<Props>> = function ListItem({ children, onClick, className }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { listItem: true }, className)} onClick={onClick}>
      {children}
    </div>
  );
};
