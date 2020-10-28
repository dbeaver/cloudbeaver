/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { AppLogo } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ServerService } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';

declare const _VERSION_: string; // declared in webpack DefinePlugin

export const Logo = observer(function Logo() {
  const serverService = useService(ServerService);
  const screenService = useService(ScreenService);

  const backendVersion = serverService.config.data?.version.slice(0, 5);
  const frontendVersion = _VERSION_?.slice(0, 5) || '';

  const isSameVersion = backendVersion === frontendVersion;

  const backendVersionTitle = `CloudBeaver: ${backendVersion}`;
  const commonVersionTitle = `CloudBeaver: ${frontendVersion}(${backendVersion})`;

  const title = isSameVersion ? backendVersionTitle : commonVersionTitle;

  return <AppLogo title={title} onClick={() => screenService.navigateToRoot()} />;
});
