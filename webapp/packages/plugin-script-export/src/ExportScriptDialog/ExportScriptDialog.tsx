/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  s,
  Translate,
  useS,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';

import type { IScriptExportTabController, IScriptExportTabProps } from '../IScriptExportTabProps.js';
import { ScriptExportService } from '../ScriptExportService.js';
import styles from './ExportScriptDialog.module.css';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';

export const ExportScriptDialog: DialogComponent<IScriptExportTabProps, string> = observer(function ExportScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const scriptExportService = useService(ScriptExportService);
  const style = useS(styles);
  const [selectedTabId, setSelectedTabId] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [exportController, setExportController] = useState<IScriptExportTabController | null>(null);

  const handleRegisterExportController = useCallback((controller: IScriptExportTabController) => {
    setExportController(prev => (prev === controller ? prev : controller));
  }, []);

  async function handleSave() {
    const controller = exportController;

    if (controller) {
      if (!controller.canExport?.()) {
        return;
      }

      setSaving(true);
      try {
        const result = await controller.export();
        resolveDialog(result);
      } catch {
        // Tab handles error display; keep dialog open. Errors handled in tab content.
      } finally {
        setSaving(false);
      }
    }
  }

  const canSave = exportController?.canExport?.() ?? !!exportController?.export;
  const tabSaving = exportController?.isExporting?.() ?? false;
  const saveDisabled = saving || tabSaving || !canSave;

  return (
    <CommonDialogWrapper size="large" className={className} fixedWidth>
      <CommonDialogHeader title="plugin_script_export_dialog_title" icon="/icons/export.svg" onReject={rejectDialog} />
      <CommonDialogBody>
        <TabsState
          container={scriptExportService.tabsContainer}
          currentTabId={selectedTabId}
          lazy
          onChange={tab => setSelectedTabId(tab.tabId)}
          {...payload}
          registerScriptExportController={handleRegisterExportController}
        >
          <div className={s(style, { box: true })}>
            <TabList className={s(style, { tabList: true })} underline />
            <div className={s(style, { contentBox: true })}>
              <TabPanelList />
            </div>
          </div>
        </TabsState>
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" variant="secondary" disabled={saving || tabSaving} onClick={() => rejectDialog()}>
          <Translate token="ui_processing_cancel" />
        </Button>
        <Fill />
        <Button type="button" disabled={saveDisabled} onClick={handleSave}>
          <Translate token="ui_processing_save" />
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
