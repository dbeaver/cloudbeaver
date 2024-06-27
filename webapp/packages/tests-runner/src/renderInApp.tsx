/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { queries, Queries, render, RenderOptions, RenderResult } from '@testing-library/react';
import { Suspense } from 'react';

import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';

import type { IApplication } from './createApp';

function ApplicationWrapper(serviceInjector: IServiceInjector): React.FC<React.PropsWithChildren> {
  return ({ children }) => (
    <Suspense fallback={null}>
      <AppContext app={serviceInjector}>{children}</AppContext>
    </Suspense>
  );
}
export function renderInApp<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  ui: React.ReactElement,
  app: IApplication,
  options?: Omit<RenderOptions<Q, Container, BaseElement>, 'queries' | 'wrapper'>,
): RenderResult<Q, Container, BaseElement> {
  return render(ui, { wrapper: ApplicationWrapper(app.injector), ...options });
}
