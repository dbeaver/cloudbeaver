/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';

import { getComputed, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useMenu } from '@cloudbeaver/core-view';

import { TabContext } from '../TabContext';
import { DATA_CONTEXT_TAB_ID } from './DATA_CONTEXT_TAB_ID';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { MENU_TAB } from './MENU_TAB';
import style from './Tab.m.css';
import { TabActions } from './TabActions';
import TabActionsStyle from './TabActions.m.css';
import type { TabProps } from './TabProps';
import { useTab } from './useTab';

export const Tab = observer<TabProps>(function Tab(props) {
  const translate = useTranslate();
  const { tabId, title, disabled, className, children, onOpen, onClose, onClick } = props;
  const ref = useRef<HTMLButtonElement>(null);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const tab = useTab(tabId, onOpen, onClose, onClick);
  const info = tab.getInfo();
  const styles = useS(style, TabActionsStyle);
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
          <TabActions state={tab.state} menuContext={props.menuContext} canClose={canClose} tabId={tabId} handleClose={tab.handleClose} />
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
