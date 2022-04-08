/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { ITabData, TabsState, TabList, TabPanel, BASE_TAB_STYLES } from '@cloudbeaver/core-ui';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlResultPanel } from './SqlResultPanel';
import { SqlResultTab } from './SqlResultTab';
import { SqlResultTabsService } from './SqlResultTabsService';

const styles = css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    TabIcon {
      composes: theme-text-surface from global;
    }
    wrapper {
      overflow: auto;
      display: flex;
      flex-direction: column;
      flex: 1;
      height: 100%;
      position: relative;
    }
    TabsBox {
      height: 100%;
    }
    TabList {
      composes: theme-background-background theme-text-text-primary-on-light from global;
      display: flex;
      overflow: auto;
    }
    TextPlaceholder {
      padding: 24px;
    }
  `;

interface Props {
  state: ISqlEditorTabState;
  onTabSelect?: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
}

export const SqlResultTabs = observer<Props>(function SqlDataResult({ state, onTabSelect, onTabClose }) {
  const style = useStyles(BASE_TAB_STYLES, styles);
  const translate = useTranslate();
  const sqlResultTabsService = useService(SqlResultTabsService);

  const orderedTabs = state.tabs
    .slice()
    .sort((tabA, tabB) => {
      const resultTabA = state.resultTabs.find(tab => tab.tabId === tabA.id);
      const resultTabB = state.resultTabs.find(tab => tab.tabId === tabB.id);

      if (resultTabA && resultTabB && tabA.order === tabB.order) {
        return resultTabA.indexInResultSet - resultTabB.indexInResultSet;
      }

      return tabA.order - tabB.order;
    });

  function handleSelect(tab: ITabData) {
    sqlResultTabsService.selectResultTab(state, tab.tabId);
    onTabSelect?.(tab.tabId);
  }

  async function handleClose(tab: ITabData) {
    const canClose = await sqlResultTabsService.canCloseResultTab(state, tab.tabId);

    if (canClose) {
      sqlResultTabsService.removeResultTab(state, tab.tabId);
      onTabClose?.(tab.tabId);
    }
  }

  if (!state.tabs.length) {
    return styled(style)(<TextPlaceholder>{translate('sql_editor_placeholder')}</TextPlaceholder>);
  }

  const currentId = state.currentTabId || '';
  const tabList = orderedTabs.map(tab => tab.id);

  return styled(style)(
    <wrapper>
      <TabsState
        currentTabId={currentId}
        tabList={tabList}
        enabledBaseActions
        onChange={handleSelect}
        onClose={handleClose}
      >
        <TabList style={styles}>
          {orderedTabs.map(result => (
            <SqlResultTab
              key={result.id}
              result={result}
              style={styles}
            />
          ))}
        </TabList>
        {orderedTabs.map(result => (
          <TabPanel key={result.id} tabId={result.id} lazy>
            <SqlResultPanel state={state} id={result.id} />
          </TabPanel>
        ))}
      </TabsState>
    </wrapper>
  );
});
