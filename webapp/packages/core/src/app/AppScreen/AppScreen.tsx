/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DialogsPortal } from '@dbeaver/core/dialogs';

import { Notifications } from '../Notifications/Notifications';
import { TopNavBar } from '../TopNavBar/TopNavBar';
import { Main } from './Main';

export function AppScreen() {

  return (
    <>
      <TopNavBar />
      <Main />
      <DialogsPortal />
      <Notifications />
    </>
  );
}
