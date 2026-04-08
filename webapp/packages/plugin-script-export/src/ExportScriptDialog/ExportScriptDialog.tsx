/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import { observable } from 'mobx';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  Translate,
  useObservableRef,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';

import { ScriptExportService, type IScriptExportTabProps } from '../ScriptExportService.js';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { ScriptExportDialogContext, type IScriptExportDialogState } from './ScriptExportDialogContext.js';

export const ExportScriptDialog: DialogComponent<IScriptExportTabProps> = observer(function ExportScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const scriptExportService = useService(ScriptExportService);
  const [selectedTabId, setSelectedTabId] = useState<string | undefined>(undefined);
  const dialogState = useObservableRef<IScriptExportDialogState>(
    () => ({
      canSubmit: false,
      onSubmit: async () => {},
      loading: false,
    }),
    {
      canSubmit: observable.ref,
      onSubmit: observable.ref,
      loading: observable.ref,
    },
    false,
  );

  async function handleSubmit() {
    try {
      await dialogState.onSubmit();
      resolveDialog();
    } catch (error) {
      // Keep dialog open on error
    }
  }

  return (
    <CommonDialogWrapper size="large" className={className} fixedWidth>
      <CommonDialogHeader title="plugin_script_export_dialog_title" icon="/icons/export.svg" onReject={rejectDialog} />
      <ScriptExportDialogContext.Provider value={{ dialogState }}>
        <TabsState
          container={scriptExportService.tabsContainer}
          currentTabId={selectedTabId}
          lazy
          onChange={tab => setSelectedTabId(tab.tabId)}
          {...payload}
        >
          <CommonDialogBody noBodyPadding noOverflow>
            <TabList className="theme-border-color-background tw:flex-shrink-0 tw:px-3" underline />
            <TabPanelList />
          </CommonDialogBody>
          <CommonDialogFooter>
            <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
              <Translate token="ui_processing_cancel" />
            </Button>
            <Fill />
            <Button type="button" disabled={!dialogState.canSubmit || dialogState.loading} onClick={handleSubmit}>
              <Translate token="ui_processing_save" />
            </Button>
          </CommonDialogFooter>
        </TabsState>
      </ScriptExportDialogContext.Provider>
    </CommonDialogWrapper>
  );
});
