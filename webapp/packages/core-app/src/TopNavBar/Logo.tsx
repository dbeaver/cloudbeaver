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

declare const version: string; // declared in webpack DefinePlugin // todo move to enviroment?

export const Logo = observer(function Logo() {
  const serverService = useService(ServerService);
  const screenService = useService(ScreenService);

  const title = `Frontend: ${version}\nBackend: ${serverService.config.data?.version}`;

  return <AppLogo title={title} onClick={() => screenService.navigateToRoot()}/>;
});
