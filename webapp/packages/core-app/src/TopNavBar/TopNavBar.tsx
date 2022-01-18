/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Placeholder, TopAppBar } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TopNavService } from './TopNavBarService';

export const TopNavBar = function TopNavBar() {
  const topNavBarService = useService(TopNavService);

  return (
    <TopAppBar>
      <Placeholder container={topNavBarService.placeholder} />
    </TopAppBar>
  );
};