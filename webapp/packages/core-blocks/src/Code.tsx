/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import style from './Code.m.css';
import { s } from './s';
import { useS } from './useS';

interface Props {
  className?: string;
}

export const Code: React.FC<React.PropsWithChildren<Props>> = function Code({ children, className }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { codeContainer: true }, className)}>
      <code>{children}</code>
    </div>
  );
};
