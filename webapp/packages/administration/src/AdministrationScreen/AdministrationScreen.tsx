/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { usePermission } from '@dbeaver/core/root';

import { EAdminPermission } from '../EAdminPermission';
import { AdministrationTopAppBar } from './AdministrationTopAppBar/AdministrationTopAppBar';

export const AdministrationScreen = observer(function AdministrationScreen() {
  if (!usePermission(EAdminPermission.admin)) {
    return <>You has no permission</>;
  }

  return (
    <>
      <AdministrationTopAppBar />
    </>
  );
});
