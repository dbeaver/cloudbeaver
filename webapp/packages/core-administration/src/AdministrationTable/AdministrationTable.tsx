/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentPropsWithRef } from 'react';
import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';

import style from './AdministrationTable.module.css';

export const AdministrationTable = observer(function AdministrationTable({ className, ...props }: ComponentPropsWithRef<'div'>) {
  const styles = useS(style);

  return <div {...props} className={s(styles, { tableContainer: true }, className)} />;
});
