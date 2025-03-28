/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type React from 'react';

import { App, useService } from '@cloudbeaver/core-di';
import { clsx } from '@dbeaver/ui-kit';

import style from './AppRefreshButton.module.css';

interface IProps {
  className?: string;
}

export const AppRefreshButton: React.FC<IProps> = function AppRefreshButton({ className }) {
  const app = useService(App);

  function refresh() {
    app.restart();
  }

  return (
    <button className={clsx(style['button'], className)} onClick={refresh}>
      Refresh
    </button>
  );
};
