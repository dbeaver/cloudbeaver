/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import { Tab as BaseTab } from 'reakit/Tab';
import styled from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { ContextMenu } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import { Icon } from '../../Icon';
import { TabContext } from '../TabContext';
import type { TabProps } from './TabProps';
import { useTab } from './useTab';
import { MENU_TAB } from './MENU_TAB';
import { DATA_CONTEXT_TABS_CONTEXT } from './DATA_CONTEXT_TABS_CONTEXT';
import { DATA_CONTEXT_TAB } from './DATA_CONTEXT_TAB';

export const Tab = observer<TabProps>(function Tab({
  tabId,
  title,
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
  const { state, getInfo, handleClose, handleOpen } = useTab(tabId, onOpen, onClose, onClick);
  const menu = useMenu(MENU_TAB);
  const info = getInfo();

  menu.context.set(DATA_CONTEXT_TABS_CONTEXT, state);
  menu.context.set(DATA_CONTEXT_TAB, tabId);

  const showMenu = menu.getItems().length > 0;
  const actionsEnabled = !!onClose || showMenu;

  return styled(useStyles(style))(
    <TabContext.Provider value={tabContext}>
      <tab-outer>
        <tab-inner>
          <BaseTab
            {...state.state}
            type="button"
            title={translate(title ?? info?.title)}
            id={tabId}
            className={className}
            disabled={disabled}
            onClick={handleOpen}
          >
            <tab-container>
              {children}
            </tab-container>
          </BaseTab>
          {actionsEnabled && (
            <tab-actions>
              {onClose && (
                <tab-action title={translate('ui_close')} onClick={handleClose}>
                  <Icon name="cross-bold" viewBox="0 0 7 8" />
                </tab-action>
              )}
              <portal>
                <ContextMenu menu={menu} placement='bottom-start' modal disclosure>
                  <tab-action>
                    <Icon name="dots" viewBox="0 0 32 32" />
                  </tab-action>
                </ContextMenu>
              </portal>
            </tab-actions>
          )}
        </tab-inner>
      </tab-outer>
    </TabContext.Provider>
  );
});
