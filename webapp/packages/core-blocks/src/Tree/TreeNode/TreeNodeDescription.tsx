/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s } from '../../s.js';
import { useS } from '../../useS.js';
import classes from './TreeNodeDescription.module.css';

interface Props extends React.HTMLAttributes<HTMLSpanElement> {
  className?: string;
}

export const TreeNodeDescription: React.FC<Props> = observer(function TreeNodeDescription({ className, children, ...rest }) {
  const styles = useS(classes);

  return (
    <span className={s(styles, { description: true }, className)} {...rest}>
      {children}
    </span>
  );
});
