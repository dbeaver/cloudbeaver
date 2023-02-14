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

import { AdministrationItemService, filterOnlyActive, IAdministrationItemRoute } from '@cloudbeaver/core-administration';
import { SlideBox, SlideElement, ErrorBoundary, SlideOverlay, slideBoxStyles, useStyles, Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { TabsState, TabList, verticalTabStyles, BASE_TAB_STYLES, OptionsPanelService } from '@cloudbeaver/core-ui';

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
    SlideElement {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
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
    Loader {
      height: 100%;
    }
  `;

interface Props {
  configurationWizard: boolean;
  activeScreen: IAdministrationItemRoute | null;
  onItemSelect: (name: string) => void;
}

export const Administration = observer<React.PropsWithChildren<Props>>(function Administration({
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
                <Loader loading={false} overlay>
                  <content>
                    <OptionsPanel />
                  </content>
                </Loader>
              </ErrorBoundary>
            </SlideElement>
            <SlideElement>
              <ErrorBoundary remount>
                <Loader loading={false} overlay>
                  <content>
                    <ItemContent activeScreen={activeScreen} configurationWizard={configurationWizard} />
                  </content>
                </Loader>
              </ErrorBoundary>
              <SlideOverlay onClick={() => optionsPanelService.close()} />
            </SlideElement>
          </SlideBox>
        </content-container>
      </TabsState>
    </container>
  );
});
