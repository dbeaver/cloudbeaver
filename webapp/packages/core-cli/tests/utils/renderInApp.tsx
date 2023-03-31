/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { AppContext, IServiceInjector } from '@cloudbeaver/core-di';
import { render, RenderOptions } from '@testing-library/react';

import type { IApplication } from './createApp';

function ApplicationWrapper(serviceInjector: IServiceInjector): React.FC<React.PropsWithChildren> {
  return function render({ children }) {
    return (
      <AppContext app={serviceInjector}>
        {children}
      </AppContext>
    );
  };
}

export function renderInApp(
  ui: React.ReactElement,
  app: IApplication,
  options?: Omit<RenderOptions, 'wrapper' | 'queries'>,
) {
  return render(ui, { wrapper: ApplicationWrapper(app.injector), ...options });
}