/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ItemList.module.css';

interface Props {
  className?: string;
}

export const ItemList: React.FC<React.PropsWithChildren<Props>> = function ItemList({ children, className }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { itemList: true }, className)}>
      <div className={s(styles, { itemListOverflowTop: true }, className)} />
      {children}
      <div className={s(styles, { itemListOverflow: true }, className)} />
    </div>
  );
};
