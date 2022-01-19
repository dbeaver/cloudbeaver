/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef, useLayoutEffect } from 'react';
import styled, { css } from 'reshadow';

import { Loader, useAppLoadingScreen, useDataResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DialogsPortal } from '@cloudbeaver/core-dialogs';
import { Notifications } from '@cloudbeaver/core-notifications';
import { PermissionsResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { useAppVersion } from './useAppVersion';

const bodyStyles = composes(
  css`
    theme {
      composes: theme-background-surface theme-text-on-surface from global
    }
  `,
  css`
    theme {
      height: 100vh;
      display: flex;
      padding: 0 !important; /* fix additional padding with modal reakit menu */
      flex-direction: column;
      overflow: hidden;
    }
  `
);

export const Body = observer(function Body() {
  useAppLoadingScreen();
  const style = useStyles(bodyStyles);
  const ref = useRef<HTMLDivElement>(null);
  const permissionsService = useDataResource(Body, PermissionsResource, undefined);
  const screenService = useService(ScreenService);
  const Screen = screenService.screen?.component;
  const { backendVersion } = useAppVersion();

  // sync classes from theme with body for popup components and etc
  useLayoutEffect(() => {
    if (ref.current) {
      document.body.className = ref.current.className;
    }
    document.documentElement.dataset.backendVersion = backendVersion;
  });

  return styled(style)(
    <theme ref={ref}>
      <Loader state={permissionsService}>{() => styled(style)(
        <>
          {Screen && <Screen {...screenService.routerService.params} />}
        </>
      )}
      </Loader>
      <DialogsPortal />
      <Notifications />
    </theme>
  );
});
