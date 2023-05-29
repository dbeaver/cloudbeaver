/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Suspense } from 'react';
import { createRoot, Root } from 'react-dom/client';
import styled from 'reshadow';

import { Body } from '@cloudbeaver/core-app';
import { DisplayError, ErrorBoundary, Loader } from '@cloudbeaver/core-blocks';
import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

interface IRender {
  initRoot(): Root;
  renderApp(): void;
  renderError(exception?: any): void;
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
      this.initRoot().render(
        styled`
          Loader {
            height: 100vh;
          }
        `(
          <AppContext app={serviceInjector}>
            <ErrorBoundary root>
              <Suspense fallback={<Loader />}>
                <Body />
              </Suspense>
            </ErrorBoundary>
          </AppContext>,
        ),
      );
    },
    renderError(exception?: any) {
      this.initRoot().render(
        <AppContext app={serviceInjector}>
          <DisplayError error={exception} root />
        </AppContext>,
      );
    },
  };
}
