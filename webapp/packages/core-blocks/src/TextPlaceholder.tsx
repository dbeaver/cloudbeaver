/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes } from 'react';

import { s } from './s.js';
import style from './TextPlaceholder.module.css';
import { useS } from './useS.js';

interface Props extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
}

export const TextPlaceholder = observer<Props>(function TextPlaceholder({ className, children, ...rest }) {
  const styles = useS(style);

  return (
    <div {...rest} className={s(styles, { container: true })}>
      <span className={s(styles, { content: true }, className)}>{children}</span>
    </div>
  );
});
