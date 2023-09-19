/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import { App, useService } from '@cloudbeaver/core-di';

import style from './AppRefreshButton.m.css';
import { s } from './s';
import { useS } from './useS';

interface IProps {
  className?: string;
}

export const AppRefreshButton: React.FC<IProps> = function AppRefreshButton({ className }) {
  const styles = useS(style);
  const app = useService(App);

  function refresh() {
    app.start();
  }

  return (
    <button className={s(styles, { button: true }, className)} onClick={refresh}>
      Refresh
    </button>
  );
};
