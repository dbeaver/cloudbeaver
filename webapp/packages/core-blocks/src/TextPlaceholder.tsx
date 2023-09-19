/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { s } from './s';
import style from './TextPlaceholder.m.css';
import { useS } from './useS';

interface Props {
  className?: string;
}

export const TextPlaceholder: React.FC<React.PropsWithChildren<Props>> = function TextPlaceholder({ className, children }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { container: true })}>
      <span className={s(styles, { content: true }, className)}>{children}</span>
    </div>
  );
};
