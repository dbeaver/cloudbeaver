/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';

import { AdministrationItemService, filterOnlyActive, IAdministrationItemRoute } from '@cloudbeaver/core-administration';
import {
  Loader,
  s,
  SContext,
  SlideBox,
  SlideElement,
  SlideOverlay,
  StyleRegistry,
  ToolsActionStyles,
  ToolsPanelStyles,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService, TabList, TabListStyles, TabsState, TabStyles, TabVertical } from '@cloudbeaver/core-ui';
import { CaptureView } from '@cloudbeaver/core-view';

import { AdministrationCaptureViewContext } from './AdministrationCaptureViewContext';
import { AdministrationViewService } from './AdministrationViewService';
import { DrawerItem } from './DrawerItem';
import { ItemContent } from './ItemContent';
import AdministrationToolbarStyles from './shared/AdministrationToolbarStyles.m.css';
import AdministrationToolbarStylesTab from './shared/AdministrationToolbarStylesTab.m.css';
import AdministrationToolbarStylesTabList from './shared/AdministrationToolbarStylesTabList.m.css';
import AdministrationToolbarToolsPanelStyles from './shared/AdministrationToolbarToolsPanelStyles.m.css';

interface Props {
  configurationWizard: boolean;
  activeScreen: IAdministrationItemRoute | null;
  onItemSelect: (name: string) => void;
}

const adminPageRegistry: StyleRegistry = [
  [
    ToolsPanelStyles,
    {
      mode: 'append',
      styles: [AdministrationToolbarToolsPanelStyles],
    },
  ],
  [
    ToolsActionStyles,
    {
      mode: 'append',
      styles: [AdministrationToolbarToolsPanelStyles],
    },
  ],
];

const tabsRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [TabVertical, AdministrationToolbarStylesTab],
    },
  ],
  [
    TabListStyles,
    {
      mode: 'append',
      styles: [TabVertical, AdministrationToolbarStylesTabList],
    },
  ],
];

export const Administration = observer<React.PropsWithChildren<Props>>(function Administration({
  configurationWizard,
  activeScreen,
  onItemSelect,
  children,
}) {
  const styles = useS(AdministrationToolbarStyles);
  const contentRef = useRef<HTMLDivElement>(null);
  const administrationViewService = useService(AdministrationViewService);
  const administrationItemService = useService(AdministrationItemService);
  const optionsPanelService = useService(OptionsPanelService);

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const items = administrationItemService.getActiveItems(configurationWizard);
  const onlyActiveItem = items.find(filterOnlyActive(configurationWizard));

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeScreen?.item]);

  return (
    <CaptureView view={administrationViewService} className={s(styles, { administration: true, captureView: true })}>
      <AdministrationCaptureViewContext />
      <TabsState currentTabId={activeScreen?.item} orientation="vertical">
        <SContext registry={tabsRegistry}>
          <TabList aria-label="Administration items">
            {items.map(item => (
              <DrawerItem
                key={item.name}
                item={item}
                configurationWizard={configurationWizard}
                disabled={!!(onlyActiveItem && onlyActiveItem.filterOnlyActive?.(configurationWizard, item) !== true)}
                onSelect={onItemSelect}
              />
            ))}
          </TabList>
        </SContext>
        <SContext registry={adminPageRegistry}>
          <div ref={contentRef} className={s(styles, { contentContainer: true })}>
            {children}
            <SlideBox className={s(styles, { slideBox: true })} open={optionsPanelService.active}>
              <SlideElement className={s(styles, { slideElement: true })}>
                <Loader className={s(styles, { loader: true })} suspense>
                  <div className={s(styles, { content: true })}>
                    <OptionsPanel />
                  </div>
                </Loader>
              </SlideElement>
              <SlideElement className={s(styles, { slideElement: true })}>
                <div className={s(styles, { content: true })}>
                  <ItemContent activeScreen={activeScreen} configurationWizard={configurationWizard} />
                </div>
                <SlideOverlay onClick={() => optionsPanelService.close()} />
              </SlideElement>
            </SlideBox>
          </div>
        </SContext>
      </TabsState>
    </CaptureView>
  );
});
