/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useRef, useState } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';

import { getComputed, Icon, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { IDataContext } from '@cloudbeaver/core-data-context';
import { useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../../ContextMenu/ContextMenu';
import { TabContext } from '../TabContext';
import type { ITabsContext } from '../TabsContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import style from './Tab.m.css';
import type { TabProps } from './TabProps';
import { useTab } from './useTab';

export const Tab = observer<TabProps>(function Tab(props) {
  const translate = useTranslate();
  const { tabId, title, disabled, className, children, onOpen, onClose, onClick } = props;
  const ref = useRef<HTMLButtonElement>(null);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const tab = useTab(tabId, onOpen, onClose, onClick);
  const info = tab.getInfo();
  const styles = useS(style);
  const canClose = getComputed(() => !!onClose || (tab.closable && tab.state.closable));

  const menu = useMenu({
    menu: MENU_TAB,
    context: props.menuContext,
  });

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, tab.state);
  menu.context.set(DATA_CONTEXT_TAB_ID, tabId);

  return (
    <TabContext.Provider value={tabContext}>
      <div className={s(styles, { tabOuter: true })}>
        <div className={s(styles, { tabInner: true, tabInnerSelected: tab.selected })}>
          <div className={s(styles, { tabActions: true }, className)}>
            {canClose && (
              <div className={s(styles, { tabAction: true })} title={translate('ui_close')} onClick={tab.handleClose}>
                <Icon className={s(styles, { icon: true })} name="cross-bold" viewBox="0 0 7 8" />
              </div>
            )}
            <TabMenu tabId={tabId} state={tab.state} menuContext={props.menuContext} />
          </div>
          <BaseTab
            ref={ref}
            {...tab.state.state}
            type="button"
            title={translate(title ?? info?.title)}
            id={tabId}
            className={s(styles, { tab: true }, className)}
            disabled={disabled}
            onClick={tab.handleOpen}
          >
            <div className={s(styles, { tabContainer: true })}>{children}</div>
          </BaseTab>
        </div>
      </div>
    </TabContext.Provider>
  );
});

interface TabMenuProps {
  tabId: string;
  state: ITabsContext<any>;
  menuContext?: IDataContext;
}

const TabMenu = observer<TabMenuProps>(function TabMenu({ tabId, state, menuContext }) {
  const styles = useS(style);

  const [menuOpened, switchState] = useState(false);
  const menu = useMenu({
    menu: MENU_TAB,
    context: menuContext,
  });

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, state);
  menu.context.set(DATA_CONTEXT_TAB_ID, tabId);

  const hidden = getComputed(() => !menu.items.length || menu.items.every(item => item.hidden));

  if (hidden) {
    return null;
  }

  return (
    <div className={s(styles, { portal: true, portalMenuOpened: menuOpened })}>
      <ContextMenu menu={menu} placement="bottom-start" modal disclosure onVisibleSwitch={switchState}>
        <div className={s(styles, { tabAction: true })}>
          <Icon className={s(styles, { icon: true })} name="dots" viewBox="0 0 32 32" />
        </div>
      </ContextMenu>
    </div>
  );
});
