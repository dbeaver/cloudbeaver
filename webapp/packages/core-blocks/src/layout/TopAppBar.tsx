/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from '../s.js';
import { useS } from '../useS.js';
import styles from './TopAppBar.module.css';

interface Props extends React.PropsWithChildren {
  className?: string;
}

export const TopAppBar: React.FC<Props> = function TopAppBar({ children, className }) {
  const style = useS(styles);

  return <header className={s(style, { header: true }, className)}>{children}</header>;
};
