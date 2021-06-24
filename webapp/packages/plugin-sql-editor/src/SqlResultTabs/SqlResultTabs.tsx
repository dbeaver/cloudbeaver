/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';
import styled, { css } from 'reshadow';

import type { ITab as TabClass } from '@cloudbeaver/core-app';
import {
  Tab, TabPanel, TabTitle, TabsBox, TextPlaceholder, ITabData, TabIcon
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlEditorNavigatorService } from '../SqlEditorNavigatorService';
import { SqlResultPanel } from './SqlResultPanel';

const styles = composes(
  css`
    Tab {
      composes: theme-ripple theme-background-surface theme-text-text-primary-on-light from global;
    }
    TabIcon {
      composes: theme-text-surface from global;
    }
    tabs {
      composes: theme-background-background theme-text-text-primary-on-light from global;
    }
  `,
  css`
    wrapper {
      overflow: auto;
      display: flex;
      flex: 1;
      height: 100%;
      position: relative;
    }
    TabsBox {
      height: 100%;
    }
  `
);

interface SqlDataResultProps {
  tab: TabClass<ISqlEditorTabState>;
}

export const SqlResultTabs = observer(function SqlDataResult({ tab }: SqlDataResultProps) {
  const style = useStyles(styles);
  const translate = useTranslate();
  const navigatorService = useService(SqlEditorNavigatorService);

  const orderedTabs = useMemo(
    () => computed(
      () => tab.handlerState.tabs
        .slice()
        .sort((tabA, tabB) => {
          const resultTabA = tab.handlerState.resultTabs.find(tab => tab.tabId === tabA.id);
          const resultTabB = tab.handlerState.resultTabs.find(tab => tab.tabId === tabB.id);

          if (resultTabA && resultTabB && tabA.order === tabB.order) {
            return resultTabA.indexInResultSet - resultTabB.indexInResultSet;
          }

          return tabA.order - tabB.order;
        })
    ),
    [tab]
  ).get();

  const handleOpen = ({ tabId }: ITabData<any>) => navigatorService.openEditorResult(tab.id, tabId);
  const handleClose = ({ tabId }: ITabData<any>) => navigatorService.closeEditorResult(tab.id, tabId);

  if (!tab.handlerState.tabs.length) {
    return <TextPlaceholder>{translate('sql_editor_placeholder')}</TextPlaceholder>;
  }

  const currentId = tab.handlerState.currentTabId || '';

  return styled(style)(
    <wrapper>
      <TabsBox
        currentTabId={currentId}
        tabs={orderedTabs.map(result => (
          <Tab key={result.id} tabId={result.id} onOpen={handleOpen} onClose={handleClose}>
            <TabIcon icon={result.icon} />
            <TabTitle>{result.name}</TabTitle>
          </Tab>
        ))}
        style={[styles]}
      >
        {orderedTabs.map(result => (
          <TabPanel key={result.id} tabId={result.id}>
            <SqlResultPanel tab={tab} id={result.id} />
          </TabPanel>
        ))}
      </TabsBox>
    </wrapper>
  );
});
