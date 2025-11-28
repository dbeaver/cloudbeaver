/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Focusable } from '../Focusable.js';
import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './ItemList.module.css';

interface Props {
  onClick: () => void;
  className?: string;
  title?: string;
}

export const ListItem: React.FC<React.PropsWithChildren<Props>> = function ListItem({ children, onClick, className, title }) {
  const styles = useS(style);

  return (
    <Focusable title={title} className={s(styles, { listItem: true }, className)} focusable onClick={onClick}>
      {children}
    </Focusable>
  );
};
