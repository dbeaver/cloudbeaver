/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObjectRef, useObservableRef, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { SessionLogsResource } from '../SessionLogsResource';
import type { ILogEntry } from './ILogEntry';
import { LogViewerService } from './LogViewerService';

interface Props {
  selectedItem: ILogEntry | null;
  logViewerService: LogViewerService;
}

export function useLogViewer() {
  const sessionLogsLoader = useResource(useLogViewer, SessionLogsResource, undefined);
  const logViewerService = useService(LogViewerService);

  const props: Props = useObservableRef(() => ({ selectedItem: null }), { selectedItem: observable.ref }, { logViewerService });

  return useObjectRef(
    () => ({
      get selectedItem() {
        return props.selectedItem;
      },
      selectItem(item: ILogEntry | null) {
        if (item?.id === props.selectedItem?.id) {
          props.selectedItem = null;
          return;
        }
        props.selectedItem = item;
      },
      async update() {
        await sessionLogsLoader.resource.refresh();
      },
      get isActive() {
        return props.logViewerService.isActive;
      },
      get logItems() {
        return sessionLogsLoader.tryGetData;
      },
      clearLog() {
        sessionLogsLoader.resource.clear();
        this.selectItem(null);
      },
    }),
    false,
  );
}
