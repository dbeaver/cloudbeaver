/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useLayoutEffect, useRef } from 'react';

import {
  AdministrationItemService,
  AdministrationScreenService,
  filterOnlyActive,
  type IAdministrationItemRoute,
} from '@cloudbeaver/core-administration';
import {
  Loader,
  s,
  SContext,
  SlideBox,
  SlideElement,
  SlideOverlay,
  type StyleRegistry,
  ToolsActionStyles,
  ToolsPanelStyles,
  useAutoLoad,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { OptionsPanelService, TabList, TabListStyles, TabsState, TabStyles } from '@cloudbeaver/core-ui';
import type { ILoadableState } from '@cloudbeaver/core-utils';
import { CaptureView } from '@cloudbeaver/core-view';

import { AdministrationCaptureViewContext } from './AdministrationCaptureViewContext.js';
import { AdministrationViewService } from './AdministrationViewService.js';
import { DrawerItem } from './DrawerItem.js';
import { ItemContent } from './ItemContent.js';
import style from './shared/Administration.module.css';
import AdministrationStylesTab from './shared/AdministrationTab.module.css';
import AdministrationStylesTabList from './shared/AdministrationTabList.module.css';
import AdministrationToolsPanelStyles from './shared/AdministrationToolsPanel.module.css';

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
      styles: [AdministrationToolsPanelStyles],
    },
  ],
  [
    ToolsActionStyles,
    {
      mode: 'append',
      styles: [AdministrationToolsPanelStyles],
    },
  ],
];

const tabsRegistry: StyleRegistry = [
  [
    TabStyles,
    {
      mode: 'append',
      styles: [AdministrationStylesTab],
    },
  ],
  [
    TabListStyles,
    {
      mode: 'append',
      styles: [AdministrationStylesTabList],
    },
  ],
];

export const Administration = observer<React.PropsWithChildren<Props>>(function Administration({
  configurationWizard,
  activeScreen,
  onItemSelect,
  children,
}) {
  const styles = useS(style);
  const contentRef = useRef<HTMLDivElement>(null);
  const administrationScreenService = useService(AdministrationScreenService);
  const administrationViewService = useService(AdministrationViewService);
  const administrationItemService = useService(AdministrationItemService);
  const optionsPanelService = useService(OptionsPanelService);

  const OptionsPanel = optionsPanelService.getPanelComponent();
  const visibleItems = administrationItemService.getActiveItems(configurationWizard);
  const onlyActiveItem = administrationItemService.items.find(filterOnlyActive(configurationWizard));
  const loaders = administrationItemService.items.reduce<ILoadableState[]>((acc, item) => [...acc, item.getLoader?.() || []].flat(), []);

  useAutoLoad(Administration, loaders);

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeScreen?.item]);

  function close() {
    optionsPanelService.close();
  }

  return (
    <CaptureView view={administrationViewService} className={s(styles, { captureView: true })}>
      <AdministrationCaptureViewContext />
      <TabsState currentTabId={activeScreen?.item} localState={administrationScreenService.itemState} orientation="vertical">
        <SContext registry={tabsRegistry}>
          <TabList aria-label="Administration items" vertical>
            {visibleItems.map(item => (
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
        <div ref={contentRef} className={s(styles, { contentContainer: true })}>
          {children}
          <SContext registry={adminPageRegistry}>
            <SlideBox className={s(styles, { slideBox: true })} open={optionsPanelService.active} onClose={close}>
              <SlideElement className={s(styles, { slideElement: true })}>
                <div className={s(styles, { content: true })}>
                  <ItemContent activeScreen={activeScreen} configurationWizard={configurationWizard} />
                </div>
                <SlideOverlay onClick={close} />
              </SlideElement>
              <SlideElement className={s(styles, { slideElement: true })}>
                <Loader className={s(styles, { loader: true })} suspense>
                  <div className={s(styles, { content: true })}>
                    <OptionsPanel />
                  </div>
                </Loader>
              </SlideElement>
            </SlideBox>
          </SContext>
        </div>
      </TabsState>
    </CaptureView>
  );
});
