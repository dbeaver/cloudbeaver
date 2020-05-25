/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { AppLogo } from '@dbeaver/core/blocks';
import { useService } from '@dbeaver/core/di';
import { ServerService } from '@dbeaver/core/root';

import { AppScreenService } from '../AppScreen/AppScreenService';

declare const version: string; // declared in webpack DefinePlugin // todo move to enviroment?

export const Logo = observer(function Logo() {
  const serverService = useService(ServerService);
  const appScreenService = useService(AppScreenService);

  const title = `Frontend: ${version}\nBackend: ${serverService.config.data?.version}`;

  return <AppLogo title={title} onClick={() => appScreenService.navigateToRoot()}/>;
});
