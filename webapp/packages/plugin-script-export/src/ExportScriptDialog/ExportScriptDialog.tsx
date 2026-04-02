/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { CommonDialogHeader, CommonDialogWrapper, s, useS } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';

import type { IScriptExportTabProps } from '../IScriptExportTabProps.js';
import { ScriptExportService } from '../ScriptExportService.js';
import styles from './ExportScriptDialog.module.css';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { ScriptExportDialogContext } from './ScriptExportDialogContext.js';

export const ExportScriptDialog: DialogComponent<IScriptExportTabProps, string> = observer(function ExportScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const scriptExportService = useService(ScriptExportService);
  const style = useS(styles);
  const [selectedTabId, setSelectedTabId] = useState<string | undefined>(undefined);

  return (
    <CommonDialogWrapper size="large" className={className} fixedWidth>
      <CommonDialogHeader title="plugin_script_export_dialog_title" icon="/icons/export.svg" onReject={rejectDialog} />
      <ScriptExportDialogContext.Provider value={{ resolveDialog, rejectDialog }}>
        <TabsState
          container={scriptExportService.tabsContainer}
          currentTabId={selectedTabId}
          lazy
          onChange={tab => setSelectedTabId(tab.tabId)}
          {...payload}
        >
          <div className={s(style, { box: true })}>
            <TabList className={s(style, { tabList: true })} underline />
            <div className={s(style, { contentBox: true })}>
              <TabPanelList />
            </div>
          </div>
        </TabsState>
      </ScriptExportDialogContext.Provider>
    </CommonDialogWrapper>
  );
});
