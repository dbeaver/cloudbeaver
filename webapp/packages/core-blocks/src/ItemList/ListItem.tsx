/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Clickable } from '../Clickable.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ItemList.module.css';

interface Props {
  onClick: () => void;
  className?: string;
}

export const ListItem: React.FC<React.PropsWithChildren<Props>> = function ListItem({ children, onClick, className }) {
  const styles = useS(style);

  return (
    <Clickable as="div" className={s(styles, { listItem: true }, className)} focusable onClick={onClick}>
      {children}
    </Clickable>
  );
};
