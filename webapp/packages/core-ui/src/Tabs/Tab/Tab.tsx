/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useRef } from 'react';
import { Tab as BaseTab } from 'reakit';

import { getComputed, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { TabContext } from '../TabContext.js';
import style from './Tab.module.css';
import { TabActions } from './TabActions.js';
import type { TabProps } from './TabProps.js';
import { useTab } from './useTab.js';

export const Tab = observer<TabProps>(function Tab({ after, ...props }) {
  const translate = useTranslate();
  const { tabId, title, disabled, className, children, onOpen, onClose, onClick } = props;
  const ref = useRef<HTMLButtonElement>(null);
  const tabContext = useMemo(() => ({ tabId }), [tabId]);
  const tab = useTab(tabId, onOpen, onClose, onClick);
  const info = tab.getInfo();
  const styles = useS(style);
  const canClose = getComputed(() => !!onClose || (tab.closable && tab.state.closable));

  function onMouseUpHandler(event: React.MouseEvent<HTMLDivElement>) {
    if (event.button === 1 && canClose) {
      tab.handleClose(event);
    }
  }

  return (
    <TabContext.Provider value={tabContext}>
      <div className={s(styles, { tabOuter: true })} onMouseUp={onMouseUpHandler}>
        <div className={s(styles, { tabInner: true, tabInnerSelected: tab.selected })}>
          <TabActions
            className={s(styles, { actions: true })}
            state={tab.state}
            menuContext={props.menuContext}
            canClose={canClose}
            tabId={tabId}
            handleClose={tab.handleClose}
          />
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
          {after}
        </div>
      </div>
    </TabContext.Provider>
  );
});
