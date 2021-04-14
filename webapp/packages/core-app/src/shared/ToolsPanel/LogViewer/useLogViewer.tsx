/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { ILogEntry } from './ILogEntry';
import { LogViewerService } from './LogViewerService';

export function useLogViewer() {
  const logViewerService = useService(LogViewerService);
  const [selectedItem, setSelectedItem] = useState<ILogEntry | null>(null);

  const props = useObjectRef({ selectedItem, logViewerService });

  return useObjectRef({
    get selectedItem() {
      return props.selectedItem;
    },
    selectItem(item: ILogEntry | null) {
      setSelectedItem(item);
    },
    get isActive() {
      return props.logViewerService.isActive;
    },
    get logItems() {
      return props.logViewerService.getLog();
    },
    closeInfoPanel() {
      setSelectedItem(null);
    },
    clearLog() {
      props.logViewerService.clearLog();
      setSelectedItem(null);
    },
  }, {});
}
