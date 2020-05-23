/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Placeholder, TopAppBar } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';

import { TopAppBarService } from './TopAppBarService';

export function AppBar() {
  const topAppBarService = useService(TopAppBarService);

  return (
    <TopAppBar>
      <Placeholder container={topAppBarService.placeholder} />
    </TopAppBar>
  );
}
