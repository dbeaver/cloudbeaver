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

function ApplicationWrapper(serviceInjector: IServiceProvider): React.FC<React.PropsWithChildren> {
  return ({ children }) => (
    <Suspense fallback={null}>
      <ServiceProviderContext serviceProvider={serviceInjector}>{children}</ServiceProviderContext>
    </Suspense>
  );
}
export function renderInApp<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  ui: React.ReactElement,
  options: Omit<RenderOptions<Q, Container, BaseElement>, 'queries' | 'wrapper'> = {},
  app?: IApplication,
): RenderResult<Q, Container, BaseElement> {
  if (!app) {
    return render(ui, options);
  }

  return render(ui, { wrapper: ApplicationWrapper(app.serviceProvider), ...options });
}
