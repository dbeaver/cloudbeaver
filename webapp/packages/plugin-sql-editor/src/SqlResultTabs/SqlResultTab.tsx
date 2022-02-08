/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import styled from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { ITabData, Tab, TabIcon, TabTitle } from '@cloudbeaver/core-ui';
import { CaptureViewContext, useDataContext } from '@cloudbeaver/core-view';

import type { ISqlEditorResultTab } from '../ISqlEditorTabState';
import { DATA_CONTEXT_SQL_EDITOR_RESULT_ID } from './DATA_CONTEXT_SQL_EDITOR_RESULT_ID';

interface Props {
  result: ISqlEditorResultTab;
  className?: string;
  style?: ComponentStyle;
  onClose?: (tab: ITabData) => Promise<void>;
}

export const SqlResultTab = observer<Props>(function SqlResultTab({
  result,
  className,
  style,
  onClose,
}) {
  const viewContext = useContext(CaptureViewContext);
  const tabMenuContext = useDataContext(viewContext);

  tabMenuContext.set(DATA_CONTEXT_SQL_EDITOR_RESULT_ID, result);

  return styled(useStyles(style))(
    <Tab
      key={result.id}
      tabId={result.id}
      style={style}
      title={result.name}
      menuContext={tabMenuContext}
      className={className}
      onClose={onClose}
    >
      <TabIcon icon={result.icon} />
      <TabTitle>{result.name}</TabTitle>
    </Tab>
  );
});