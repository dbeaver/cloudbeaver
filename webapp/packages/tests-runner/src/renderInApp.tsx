/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup, queries, type Queries, render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { Suspense } from 'react';

import { type IServiceProvider, ServiceProvider } from '@cloudbeaver/core-di';

import { userEvent, type UserEvent } from '@testing-library/user-event';

import type { IApplication } from './createApp.js';

function resetDocument() {
  document.body.innerHTML = '';
  document.body.className = '';
  cleanup();
}

function ApplicationWrapper(serviceInjector: IServiceProvider): React.FC<React.PropsWithChildren> {
  return ({ children }) => (
    <Suspense fallback={null}>
      <ServiceProvider provider={serviceInjector}>{children}</ServiceProvider>
    </Suspense>
  );
}

type App<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
> = RenderResult<Q, Container, BaseElement> & { user: ReturnType<UserEvent['setup']> };

// TODO move it to the common-react/@dbeaver/react-tests packages
export function renderInApp<
  Q extends Queries = typeof queries,
  Container extends Element | DocumentFragment = HTMLElement,
  BaseElement extends Element | DocumentFragment = Container,
>(
  ui: React.ReactElement,
  options: Omit<RenderOptions<Q, Container, BaseElement>, 'queries' | 'wrapper'> = {},
  app?: IApplication,
): App<Q, Container, BaseElement> {
  resetDocument();
  const user = userEvent.setup();

  if (!app) {
    return {
      ...render(ui, options),
      user,
    } as App<Q, Container, BaseElement>;
  }

  return {
    ...render(ui, { wrapper: ApplicationWrapper(app.serviceProvider), ...options }),
    user,
  } as App<Q, Container, BaseElement>;
}
