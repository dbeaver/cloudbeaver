/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';

import { Body } from '@cloudbeaver/core-app';
import { ErrorBoundary, Loader } from '@cloudbeaver/core-blocks';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

export function renderLayout(serviceInjector: IServiceInjector): void {
  const container = document.getElementById('root');
  const root = createRoot(container!);

  root.render(
    // <StrictMode>
    <ErrorBoundary root>
      <AppContext app={serviceInjector}>
        <Suspense fallback={<Loader />}>
          <Body />
        </Suspense>
      </AppContext>
    </ErrorBoundary>
    // </StrictMode>
  );
}
