/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import clsx from 'clsx';
import { DetailedHTMLProps, forwardRef } from 'react';

import classes from './DataGridContainer.module.css';

export const DataGridContainer = forwardRef<HTMLDivElement, DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>>(
  function DataGridContainer(props, ref) {
    return <div {...props} ref={ref} className={clsx(classes.container, props.className)} />;
  },
);
