/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import styles from './Card.module.css';

export const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(function CardTitle({ className, ...props }, ref) {
  const classes = useS(styles);

  return <h3 ref={ref} {...props} className={s(classes, { title: true }, className)} />;
});
