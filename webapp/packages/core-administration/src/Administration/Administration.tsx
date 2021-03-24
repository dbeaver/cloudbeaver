/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import { TabsState, TabList, verticalTabStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { AdministrationItemService, filterOnlyActive } from '../AdministrationItem/AdministrationItemService';
import type { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute';
import { DrawerItem } from './DrawerItem';
import { ItemContent } from './ItemContent';

const tabsStyles = composes(
  css`
    TabList {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
    Tab {
      composes: theme-ripple theme-background-background theme-ripple-selectable from global;
    }
  `,
  css`
    Tab {
      color: inherit;
    }
  `
);

const administrationStyles = composes(
  css`
    container {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    drawer {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
  `,
  css`
    container {
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
    }
    drawer {
      position: relative;
      flex: auto 0 0;
      width: 250px;
      padding-top: 16px;
      border-right: 2px solid;
    }
    content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
  `
);

type Props = React.PropsWithChildren<{
  configurationWizard: boolean;
  activeScreen: IAdministrationItemRoute | null;
  onItemSelect: (name: string) => void;
}>;

export const Administration: React.FC<Props> = observer(function Administration({
  configurationWizard, activeScreen, onItemSelect, children,
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const administrationItemService = useService(AdministrationItemService);
  const items = administrationItemService.getActiveItems(configurationWizard);
  const hasOnlyActive = items.some(filterOnlyActive(configurationWizard));

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeScreen?.item]);

  return styled(useStyles(verticalTabStyles, administrationStyles, tabsStyles))(
    <container as='div'>
      <TabsState currentTabId={activeScreen?.item} orientation='vertical'>
        <drawer as='div'>
          <TabList aria-label="Administration items">
            {items.map(item => (
              <DrawerItem
                key={item.name}
                item={item}
                configurationWizard={configurationWizard}
                style={[verticalTabStyles, tabsStyles]}
                disabled={hasOnlyActive}
                onSelect={onItemSelect}
              />
            ))}
          </TabList>
        </drawer>
        <content ref={contentRef} as='div'>
          {children}
          <ItemContent
            activeScreen={activeScreen}
            configurationWizard={configurationWizard}
          />
        </content>
      </TabsState>
    </container>
  );
});
