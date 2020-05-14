/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useService } from '@dbeaver/core/di';

import { MainRightMenuService } from './MainRightMenuService';
import { RightMenuItem } from './RightMenuItem';

export const MainRightMenu = observer(function MainRightMenu() {
  const mainRightMenuService = useService(MainRightMenuService);

  return (
    <>
      {mainRightMenuService.getMenu().map((topItem, i) => (
        <RightMenuItem key={i} menuItem={topItem}/>
      ))}
    </>
  );
});
