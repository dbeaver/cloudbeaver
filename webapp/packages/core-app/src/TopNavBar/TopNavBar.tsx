/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Placeholder, TopAppBar } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TopNavService } from './TopNavBarService';

export function TopNavBar() {
  const topNavBarService = useService(TopNavService);

  return (
    <TopAppBar>
      <Placeholder container={topNavBarService.placeholder} />
    </TopAppBar>
  );
}
