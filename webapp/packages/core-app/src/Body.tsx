/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';

import { DialogsPortal, Loader, s, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Notifications } from '@cloudbeaver/core-notifications';
import { ProjectInfoResource } from '@cloudbeaver/core-projects';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { SessionPermissionsResource } from '@cloudbeaver/core-root';
import { ScreenService } from '@cloudbeaver/core-routing';
import { ThemeService } from '@cloudbeaver/core-theming';
import { DNDProvider } from '@cloudbeaver/core-ui';
import { useAppVersion } from '@cloudbeaver/core-version';

import style from './Body.module.css';
import { useAppHeight } from './useAppHeight.js';
import { useClientActivity } from './useClientActivity.js';
import icons from '@dbeaver/ui-kit/assets/icons/icons.svg?raw';

export const Body = observer(function Body() {
  // const serverConfigLoader = useResource(Body, ServerConfigResource, undefined);
  const styles = useS(style);
  const themeService = useService(ThemeService);
  const ref = useRef<HTMLDivElement>(null);
  useResource(Body, SessionPermissionsResource, undefined);
  const screenService = useService(ScreenService);
  const Screen = screenService.screen?.component;
  const { backendVersion } = useAppVersion();

  // TODO: must be loaded in place where it is used
  useResource(Body, ProjectInfoResource, CachedMapAllKey, { silent: true });

  // sync classes from theme with body for popup components and etc
  useLayoutEffect(() => {
    if (ref.current) {
      document.body.className = ref.current.className;
    }
    document.documentElement.dataset['backendVersion'] = backendVersion;
  });

  useAppHeight();
  useClientActivity();

  return (
    <DNDProvider>
      <Loader className={s(styles, { loader: true })} suspense>
        <div
          ref={ref}
          className={s(
            styles,
            { bodyContent: true },
            `theme-${themeService.currentTheme.class}`,
            'theme-typography--body2',
            'theme-background-surface',
            'theme-text-on-surface',
          )}
        >
          <Loader className={s(styles, { loader: true })} suspense>
            {Screen && <Screen {...screenService.routerService.params} />}
          </Loader>
          <Loader suspense overlay>
            <DialogsPortal />
          </Loader>
          <Loader suspense overlay>
            <Notifications />
          </Loader>
          <div style={{ display: 'none' }} dangerouslySetInnerHTML={{ __html: icons }} />
        </div>
      </Loader>
    </DNDProvider>
  );
});
