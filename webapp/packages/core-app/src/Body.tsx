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

import { Loader, useAppLoadingScreen, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { DialogsPortal } from '@cloudbeaver/core-dialogs';
import { Notifications } from '@cloudbeaver/core-notifications';
import { SessionPermissionsResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { ThemeService } from '@cloudbeaver/core-theming';
import { DNDProvider } from '@cloudbeaver/core-ui';
import { useAppVersion } from '@cloudbeaver/plugin-version';

const bodyStyles = css`
    theme {
      composes: theme-background-surface theme-text-on-surface theme-typography from global;
      height: 100vh;
      display: flex;
      padding: 0 !important; /* fix additional padding with modal reakit menu */
      flex-direction: column;
      overflow: hidden;
    }
  `;

const loaderStyle = css`
    ExceptionMessage {
      padding: 24px;
    }
  `;

export const Body = observer(function Body() {
  useAppLoadingScreen();
  // const serverConfigLoader = useResource(Body, ServerConfigResource, undefined);
  const themeService = useService(ThemeService);
  const style = useStyles(bodyStyles);
  const ref = useRef<HTMLDivElement>(null);
  const permissionsService = useResource(Body, SessionPermissionsResource, undefined);
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
    <DNDProvider>
      <theme ref={ref} className={`theme-${themeService.currentTheme.id}`}>
        <Loader state={[permissionsService]} style={loaderStyle}>{() => styled(style)(
          <>
            {Screen && <Screen {...screenService.routerService.params} />}
          </>
        )}
        </Loader>
        <DialogsPortal />
        <Notifications />
      </theme>
    </DNDProvider>
  );
});
