/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import type { ComponentPropsWithRef } from 'react';

import { s } from '../s.js';
import { useS } from '../useS.js';
import classes from './ToolbarActions.module.css';

export const ToolbarActions = observer(function ToolbarActions({ className, ...props }: ComponentPropsWithRef<'div'>) {
  const styles = useS(classes);

  return <div {...props} className={s(styles, { toolbarActions: true }, className)} />;
});
