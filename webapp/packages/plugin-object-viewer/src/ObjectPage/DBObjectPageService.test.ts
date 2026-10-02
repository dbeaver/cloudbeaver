/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { describe, expect, it, vi } from 'vitest';

import { PromiseExecutor } from '@cloudbeaver/core-utils';
import type { ITab } from '@cloudbeaver/plugin-navigation-tabs';

import type { IObjectViewerTabState } from '../IObjectViewerTabState.js';
import { DBObjectPageService } from './DBObjectPageService.js';
import type { ObjectPageCallback } from './ObjectPage.js';

function createPage(onClose: ObjectPageCallback<unknown>) {
  const service = new DBObjectPageService();
  const page = service.register({
    key: 'data',
    priority: 0,
    getTabComponent: () => () => null,
    getPanelComponent: () => () => null,
    onClose,
  });
  const tab: ITab<IObjectViewerTabState> = {
    id: 'table',
    userId: 'user',
    projectId: null,
    handlerId: 'object-viewer',
    handlerState: {
      projectId: undefined,
      connectionKey: undefined,
      error: false,
      childrenError: false,
      objectId: 'table',
      parents: [],
      folderId: '',
      pageId: page.key,
      pagesState: { [page.key]: {} },
    },
  };
  return { service, page, tab };
}

describe('DBObjectPageService', () => {
  it('finishes disposal before the unload pass can close the same result again', async () => {
    const closed = new PromiseExecutor<void>();
    const closeResult = vi.fn(() => closed.promise);
    let modelExists = true;
    const onClose = vi.fn(async () => {
      if (modelExists) {
        await closeResult();
        modelExists = false;
      }
    });
    const { service, tab } = createPage(onClose);

    // ObjectViewerTabService calls closePages for both onClose and onUnload.
    const closing = service.closePages(tab).then(() => service.closePages(tab));
    try {
      await new Promise(resolve => setTimeout(resolve, 0));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(closeResult).toHaveBeenCalledTimes(1);
    } finally {
      closed.resolve();
      await closing;
    }

    expect(onClose).toHaveBeenCalledTimes(2);
    expect(closeResult).toHaveBeenCalledTimes(1);
    expect(modelExists).toBe(false);
  });

  it('propagates asynchronous disposal failures to the caller', async () => {
    const closed = new PromiseExecutor<void>();
    const error = new Error('Disposal failed');
    const { service, tab } = createPage(() => closed.promise);
    const closing = expect(service.closePages(tab)).rejects.toBe(error);

    closed.reject(error);

    await closing;
  });

  it('preserves the page context and state for synchronous callbacks', async () => {
    const onClose = vi.fn();
    const { service, page, tab } = createPage(onClose);

    await service.closePages(tab);

    expect(onClose).toHaveBeenCalledExactlyOnceWith(tab, tab.handlerState.pagesState[page.key]);
    expect(onClose.mock.contexts[0]).toBe(page);
  });
});
