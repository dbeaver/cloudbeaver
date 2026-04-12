/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Fill,
  Form,
  Translate,
  useForm,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';

import { ScriptExportService, type IScriptExportTabProps } from '../ScriptExportService.js';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { ExportScriptDialogContext, type IExportScriptDialogContext } from './ExportScriptDialogContext.js';

export const ExportScriptDialog: DialogComponent<IScriptExportTabProps> = observer(function ExportScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const scriptExportService = useService(ScriptExportService);
  const [selectedTabId, setSelectedTabId] = useState<string | undefined>(undefined);
  const form = useForm();

  const context = useMemo<IExportScriptDialogContext>(
    () => ({
      resolveDialog,
      rejectDialog,
    }),
    [resolveDialog, rejectDialog],
  );

  return (
    <ExportScriptDialogContext.Provider value={context}>
      <Form context={form}>
        <CommonDialogWrapper size="large" className={className} fixedWidth>
          <CommonDialogHeader title="plugin_script_export_dialog_title" icon="/icons/export.svg" onReject={rejectDialog} />
          <TabsState
            container={scriptExportService.tabsContainer}
            currentTabId={selectedTabId}
            lazy
            onChange={tab => setSelectedTabId(tab.tabId)}
            {...payload}
          >
            <CommonDialogBody noBodyPadding noOverflow>
              <TabList className="theme-border-color-background tw:shrink-0 tw:px-3" underline />
              <TabPanelList className="tw:flex-col tw:gap-4 tw:p-6 tw:w-full tw:overflow-auto" />
            </CommonDialogBody>
            <CommonDialogFooter>
              <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
                <Translate token="ui_processing_cancel" />
              </Button>
              <Fill />
              <Button type="button" onClick={() => form.submit()}>
                <Translate token="ui_processing_save" />
              </Button>
            </CommonDialogFooter>
          </TabsState>
        </CommonDialogWrapper>
      </Form>
    </ExportScriptDialogContext.Provider>
  );
});
