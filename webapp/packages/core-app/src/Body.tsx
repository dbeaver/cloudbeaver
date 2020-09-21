/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { useService } from '@cloudbeaver/core-di';
import { DialogsPortal } from '@cloudbeaver/core-dialogs';
import { Notifications } from '@cloudbeaver/core-notifications';
import { ScreenService } from '@cloudbeaver/core-routing';
import { useStyles } from '@cloudbeaver/core-theming';

const bodyStyles = css`
  theme {
    height: 100vh;
    display: flex;
    flex-direction: column;
  }
`;

export const Body = observer(function Body() {
  const screenService = useService(ScreenService);
  const Screen = screenService.screen?.component;

  return styled(useStyles(bodyStyles))(
    <theme as="div">
      {Screen && <Screen />}
      <DialogsPortal />
      <Notifications />
    </theme>
  );
});
