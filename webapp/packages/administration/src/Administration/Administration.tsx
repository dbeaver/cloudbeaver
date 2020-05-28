/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { css } from 'reshadow';

import { TabsState, TabList, verticalTabStyles } from '@dbeaver/core/blocks';
import { useController } from '@dbeaver/core/di';
import { composes, useStyles } from '@dbeaver/core/theming';

import { AdministrationController } from './AdministrationController';
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
      composes: theme-background-surface theme-text-on-surface from global;
    }
    drawer {
      composes: theme-border-color-background from global;
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
      width: 250px;
      padding-top: 16px;
      border-right: 2px solid;
    }
    content {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
  `
);

type Props = {
  activeItem: string | null;
  onItemSelect(name: string): void;
}

export const Administration = observer(function Administration({ activeItem, onItemSelect }: Props) {
  const controller = useController(AdministrationController);

  return styled(useStyles(verticalTabStyles, administrationStyles, tabsStyles))(
    <container as='div'>
      <TabsState currentTabId={activeItem} orientation='vertical'>
        <drawer as='div'>
          <TabList aria-label="Administration items">
            {controller.items.map(item => (
              <DrawerItem key={item.name} item={item} onSelect={onItemSelect} style={[verticalTabStyles, tabsStyles]} />
            ))}
          </TabList>
        </drawer>
        <content as='div'>
          <ItemContent activeItemName={activeItem}/>
        </content>
      </TabsState>
    </container>
  );
});
