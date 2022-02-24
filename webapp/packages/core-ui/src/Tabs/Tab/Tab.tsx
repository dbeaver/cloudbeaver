/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';
import styled, { use } from 'reshadow';

import { getComputed, Icon } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { IDataContext, useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../../ContextMenu/ContextMenu';
import { TabContext } from '../TabContext';
import type { ITabsContext } from '../TabsContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import type { TabProps } from './TabProps';
import { useTab } from './useTab';

export const Tab = observer<TabProps>(function Tab({
  tabId,
  title,
  menuContext,
  disabled,
  className,
  children,
  style,
  onOpen,
  onClose,
  onClick,
}) {
  const translate = useTranslate();
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const tab = useTab(tabId, onOpen, onClose, onClick);
  const info = tab.getInfo();

  const canClose = getComputed(() => !!onClose || tab.state.closable);

  return styled(useStyles(style))(
    <TabContext.Provider value={tabContext}>
      <tab-outer>
        <tab-inner>
          <BaseTab
            {...tab.state.state}
            type="button"
            title={translate(title ?? info?.title)}
            id={tabId}
            className={className}
            disabled={disabled}
            onClick={tab.handleOpen}
          >
            <tab-container>
              {children}
            </tab-container>
          </BaseTab>
          <tab-actions>
            {canClose && (
              <tab-action title={translate('ui_close')} onClick={tab.handleClose}>
                <Icon name="cross-bold" viewBox="0 0 7 8" />
              </tab-action>
            )}
            <TabMenu
              tabId={tabId}
              state={tab.state}
              menuContext={menuContext}
              style={style}
            />
          </tab-actions>
        </tab-inner>
      </tab-outer>
    </TabContext.Provider>
  );
});

interface TabMenuProps {
  tabId: string;
  state: ITabsContext<any>;
  menuContext?: IDataContext;
  style?: ComponentStyle;
}

const TabMenu = observer<TabMenuProps>(function TabMenu({
  tabId,
  state,
  menuContext,
  style,
}) {
  const [menuOpened, switchState] = useState(false);
  const menu = useMenu({
    menu: MENU_TAB,
    context: menuContext,
  });

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, state);
  menu.context.set(DATA_CONTEXT_TAB_ID, tabId);

  return styled(useStyles(style))(
    <portal {...use({ menuOpened })}>
      <ContextMenu menu={menu} placement='bottom-start' modal disclosure onVisibleSwitch={switchState}>
        <tab-action>
          <Icon name="dots" viewBox="0 0 32 32" />
        </tab-action>
      </ContextMenu>
    </portal>
  );
});