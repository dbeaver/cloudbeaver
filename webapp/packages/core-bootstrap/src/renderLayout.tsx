/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { StrictMode, Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';

import { Body } from '@cloudbeaver/core-app';
import { AppRefreshButton, DisplayError, ErrorBoundary, Loader } from '@cloudbeaver/core-blocks';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

interface IRender {
  initRoot(): Root;
  renderApp(): void;
  renderError(): void;
  unmount(): void;
}

export function renderLayout(serviceInjector: IServiceInjector): IRender {
  let root: Root | undefined;

  return {
    initRoot(): Root {
      this.unmount();
      let container = document.body.querySelector<HTMLDivElement>('div#root');
      if (!container) {
        container = document.createElement('div');
        container.id = 'root';

        document.body.prepend(container);
      }

      root = createRoot(container);

      return root;
    },
    unmount() {
      if (root) {
        root.unmount();
        root = undefined;
      }
    },
    renderApp() {
      this.initRoot()
        .render(
        // <StrictMode>
          <AppContext app={serviceInjector}>
            <ErrorBoundary root>
              <Suspense fallback={<Loader />}>
                <Body />
              </Suspense>
            </ErrorBoundary>
          </AppContext>
        // </StrictMode>
        );
    },
    renderError() {
      this.initRoot()
        .render(
          <AppContext app={serviceInjector}>
            <DisplayError root>
              <AppRefreshButton />
            </DisplayError>
          </AppContext>
        );
    },
  };
}
