/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Suspense } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { BodyLazy } from '@cloudbeaver/core-app';
import { DisplayError, ErrorBoundary, Loader, s } from '@cloudbeaver/core-blocks';
import { App, AppContext, HideAppLoadingScreen, IServiceProvider, ServiceProvider } from '@cloudbeaver/core-di';

import styles from './renderLayout.module.css';
import { defaultTranslateFn, TranslateContext } from '@dbeaver/react-translate';
import { LocalizationService } from '@cloudbeaver/core-localization';

interface IRender {
  initRoot(): Root;
  renderApp(serviceProvider: IServiceProvider | null): void;
  renderError(serviceProvider: IServiceProvider | null, exception?: any): void;
  unmount(): void;
}

export function renderLayout(app: App): IRender {
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
    renderApp(serviceProvider: IServiceProvider | null) {
      const translate = serviceProvider?.getService(LocalizationService).translate || defaultTranslateFn;

      this.initRoot().render(
        <AppContext value={app}>
          <TranslateContext.Provider
            value={{
              translate,
            }}
          >
            <ErrorBoundary fallback={<HideAppLoadingScreen />} simple>
              <ServiceProvider provider={serviceProvider!}>
                <ErrorBoundary fallback={<HideAppLoadingScreen />} root>
                  <Suspense fallback={<Loader className={s(styles, { loader: true })} />}>
                    <BodyLazy />
                    <HideAppLoadingScreen />
                  </Suspense>
                </ErrorBoundary>
              </ServiceProvider>
            </ErrorBoundary>
          </TranslateContext.Provider>
        </AppContext>,
      );
    },
    renderError(serviceProvider: IServiceProvider | null, exception?: any) {
      if (exception) {
        console.error(exception);
      }
      this.initRoot().render(
        <AppContext value={app}>
          <ErrorBoundary fallback={<HideAppLoadingScreen />} simple>
            <ServiceProvider provider={serviceProvider!}>
              <DisplayError error={exception} root />
              <HideAppLoadingScreen />
            </ServiceProvider>
          </ErrorBoundary>
        </AppContext>,
      );
    },
  };
}
