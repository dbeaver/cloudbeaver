/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { useService } from '@cloudbeaver/core-di';

import { ScriptExportService, type IScriptExportTabProps } from '../ScriptExportService.js';
import { TabList, TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { ScriptExportDialogContext } from './ScriptExportDialogContext.js';

export const ExportScriptDialog: DialogComponent<IScriptExportTabProps> = observer(function ExportScriptDialog({
  payload,
  resolveDialog,
  rejectDialog,
  className,
}) {
  const scriptExportService = useService(ScriptExportService);
  const [selectedTabId, setSelectedTabId] = useState<string | undefined>(undefined);
  const [footerNode, setFooterNode] = useState<HTMLDivElement | null>(null);
  const footerRef = useCallback((node: HTMLDivElement | null) => setFooterNode(node), []);

  const FooterSlot: React.FC<React.PropsWithChildren> = useCallback(
    ({ children }) => {
      if (!footerNode) {
        return null;
      }
      return createPortal(children, footerNode);
    },
    [footerNode],
  );

  return (
    <CommonDialogWrapper size="large" className={className} fixedWidth>
      <CommonDialogHeader title="plugin_script_export_dialog_title" icon="/icons/export.svg" onReject={rejectDialog} />
      <ScriptExportDialogContext.Provider value={{ resolveDialog, rejectDialog, FooterSlot }}>
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
            <div ref={footerRef} className="tw:contents" />
          </CommonDialogFooter>
        </TabsState>
      </ScriptExportDialogContext.Provider>
    </CommonDialogWrapper>
  );
});
