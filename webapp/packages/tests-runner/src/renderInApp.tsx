/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom/vitest';
import { queries, type Queries, render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { Suspense } from 'react';

import { type IServiceProvider, ServiceProviderContext } from '@cloudbeaver/core-di';

import type { IApplication } from './createApp.js';

function ApplicationWrapper(serviceInjector: IServiceProvider, withSuspense: boolean): React.FC<React.PropsWithChildren> {
  return ({ children }) =>
    withSuspense ? (
      <Suspense fallback={null}>
        <ServiceProviderContext serviceProvider={serviceInjector}>{children}</ServiceProviderContext>
      </Suspense>
    ) : (
      <ServiceProviderContext serviceProvider={serviceInjector}>{children}</ServiceProviderContext>
    );
}
export function renderInApp<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  ui: React.ReactElement,
  app: IApplication,
  withSuspense = false,
  options?: Omit<RenderOptions<Q, Container, BaseElement>, 'queries' | 'wrapper'>,
): RenderResult<Q, Container, BaseElement> {
  return render(ui, { wrapper: ApplicationWrapper(app.serviceProvider, withSuspense), ...options });
}
