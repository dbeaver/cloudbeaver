/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Placeholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TopNavBar } from '@cloudbeaver/plugin-top-app-bar';

import { AppScreenService } from './AppScreenService';
import { Main } from './Main';

export function AppScreen() {
  const appScreenService = useService(AppScreenService);
  return (
    <>
      <Placeholder container={appScreenService.placeholder} />
      <TopNavBar />
      <Main />
    </>
  );
}
