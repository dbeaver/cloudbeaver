/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { memo } from 'react';

import { Loader, Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AppScreenService } from './AppScreenService.js';
import { Main } from './Main.js';

export const AppScreen = memo(function AppScreen() {
  const appScreenService = useService(AppScreenService);
  return (
    <Loader suspense>
      <Placeholder container={appScreenService.placeholder} />
      <Loader suspense>
        <Main />
      </Loader>
    </Loader>
  );
});
