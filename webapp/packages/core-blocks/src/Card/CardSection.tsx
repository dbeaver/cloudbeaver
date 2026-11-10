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

export const CardSection = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function CardSection({ className, ...props }, ref) {
  const classes = useS(styles);

  return <div ref={ref} {...props} className={s(classes, { section: true }, className)} />;
});
