/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';
import styled, { css } from 'reshadow';

import { SlideBox, SlideElement, ErrorBoundary, SlideOverlay, slideBoxStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';
import { TabsState, TabList, verticalTabStyles, BASE_TAB_STYLES, OptionsPanelService } from '@cloudbeaver/core-ui';

import { AdministrationItemService, filterOnlyActive } from '../AdministrationItem/AdministrationItemService';
import type { IAdministrationItemRoute } from '../AdministrationItem/IAdministrationItemRoute';
import { DrawerItem } from './DrawerItem';
import { ItemContent } from './ItemContent';

const tabsStyles = css`
    TabList {
      composes: theme-background-surface theme-text-on-surface theme-border-color-background from global;
    }
    Tab {
      composes: theme-ripple theme-background-background theme-ripple-selectable from global;
      color: inherit;
    }
  `;

const administrationStyles = css`
    container {
      composes: theme-background-secondary theme-text-on-secondary from global;
      display: flex;
      flex-direction: row;
      flex: 1;
      overflow: hidden;
    }
    TabList {
      width: 240px;
      padding-top: 16px;
      border-right: 2px solid;
    }
    content-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
    SlideBox {
      flex: 1;
    }
    content {
      height: 100%;
      display: flex;
      flex-direction: column;
      overflow: auto;
    }
  `;

interface Props {
  configurationWizard: boolean;
  activeScreen: IAdministrationItemRoute | null;
  onItemSelect: (name: string) => void;
}

export const Administration = observer<Props>(function Administration({
  configurationWizard, activeScreen, onItemSelect, children,
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const administrationItemService = useService(AdministrationItemService);
  const optionsPanelService = useService(OptionsPanelService);

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const items = administrationItemService.getActiveItems(configurationWizard);
  const hasOnlyActive = items.some(filterOnlyActive(configurationWizard));

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeScreen?.item]);

  return styled(useStyles(BASE_TAB_STYLES, verticalTabStyles, administrationStyles, tabsStyles, slideBoxStyles))(
    <container>
      <TabsState currentTabId={activeScreen?.item} orientation='vertical'>
        <TabList aria-label="Administration items">
          {items.map(item => (
            <DrawerItem
              key={item.name}
              item={item}
              configurationWizard={configurationWizard}
              style={[BASE_TAB_STYLES, verticalTabStyles, tabsStyles]}
              disabled={hasOnlyActive}
              onSelect={onItemSelect}
            />
          ))}
        </TabList>
        <content-container ref={contentRef} as='div'>
          {children}
          <SlideBox open={optionsPanelService.active}>
            <SlideElement>
              <ErrorBoundary remount>
                <content>
                  <OptionsPanel />
                </content>
              </ErrorBoundary>
            </SlideElement>
            <SlideElement>
              <ErrorBoundary remount>
                <content>
                  <ItemContent activeScreen={activeScreen} configurationWizard={configurationWizard} />
                </content>
              </ErrorBoundary>
              <SlideOverlay onClick={() => optionsPanelService.close()} />
            </SlideElement>
          </SlideBox>
        </content-container>
      </TabsState>
    </container>
  );
});
