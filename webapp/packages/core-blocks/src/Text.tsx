/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from './s.js';
import classes from './Text.module.css';
import { useS } from './useS.js';

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  truncate?: boolean;
}

export const Text = observer<Props>(function Text({ truncate, children, className, ...rest }) {
  const styles = useS(classes);
  return (
    <div className={s(styles, { truncate }, className)} {...rest}>
      {children}
    </div>
  );
});
