/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createRoot } from 'react-dom/client';

import { Body } from '@cloudbeaver/core-app';
import { ErrorBoundary } from '@cloudbeaver/core-blocks';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

export function renderLayout(serviceInjector: IServiceInjector): void {
  const container = document.getElementById('root');
  const root = createRoot(container!);

  root.render(
    <ErrorBoundary root>
      <AppContext app={serviceInjector}>
        <Body />
      </AppContext>
    </ErrorBoundary>
  );
}
