/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import { Button, useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { EObjectFeature, NavNodeInfoResource, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import type { ConnectionFormAiContainerProps } from '../../connection-ai-settings/ConnectionFormAiService.js';
import { getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { AiScopeDialog } from '../AiScopeDialogLazy.js';
import { getScopeSelectionRoots } from '../getScopeSelectionRoots.js';

import { getConnectionAiScopePart } from './getConnectionAiScopePart.js';
import { SelectionSummary } from './SelectionSummary.js';
import { ConnectionInfoAiResource } from '../../ConnectionInfoAiResource.js';

export const ConnectionAiScope = observer<ConnectionFormAiContainerProps>(function ConnectionAiScope({ formState, metaTransferConfirmed = false }) {
  const translate = useTranslate();
  const part = getConnectionAiScopePart(formState);
  const options = getConnectionFormOptionsPart(formState);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const connectionInfoResource = useService(ConnectionInfoResource);
  const connectionInfoAiResource = useService(ConnectionInfoAiResource);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const navNodeInfoResource = useService(NavNodeInfoResource);

  useAutoLoad(ConnectionAiScope, [part]);

  const disabled = !options.connectionKey || !part.isLoaded() || formState.isDisabled || formState.isReadOnly || part.isReadOnly || part.isError();
  const custom = part.state.scope === AiDatabaseScope.Custom;
  const selectedIds = custom ? getScopeSelectionRoots(part.state.customObjectIds, id => navNodeInfoResource.getParents(id)) : [];
  const previewIds = selectedIds.slice(0, 3);
  const remaining = selectedIds.length - previewIds.length;
  const connected = !!options.connectionKey && !!connectionInfoResource.get(options.connectionKey)?.connected;
  const showSelection = connected && part.isLoaded() && !part.isError();
  const active = showSelection && metaTransferConfirmed && selectedIds.length > 0;
  const title = translate(active ? 'plugin_ai_scope_custom_active' : 'plugin_ai_scope_custom');

  let count: number | string = '—';

  if (showSelection) {
    count = selectedIds.length;
  }

  let summary = '';

  if (!options.connectionKey) {
    summary = translate('plugin_ai_scope_save_first');
  } else if (!connected) {
    summary = translate('plugin_ai_scope_disconnected');
  } else if (!part.isLoaded()) {
    summary = translate('ui_processing_loading');
  } else if (showSelection) {
    if (!custom) {
      summary = translate('plugin_ai_scope_not_set');
    } else if (selectedIds.length === 0) {
      summary = translate('plugin_ai_scope_empty');
    } else {
      summary = previewIds.map(getObjectName).join(', ');

      if (remaining > 0) {
        summary = translate('plugin_ai_scope_preview_more', undefined, { objects: summary, count: remaining });
      }
    }
  }

  function getObjectName(id: string): string {
    const node = navNodeInfoResource.get(id);

    if (node?.name) {
      if (node.objectFeatures.includes(EObjectFeature.entity)) {
        const schema = navNodeInfoResource
          .getParents(id)
          .map(parent => navNodeInfoResource.get(parent))
          .find(parent => parent?.objectFeatures.includes(EObjectFeature.schema));

        if (schema?.name) {
          return `${schema.name}.${node.name}`;
        }
      }

      return node.name;
    }

    const segment = id.split('/').pop() || id;

    try {
      return decodeURIComponent(segment);
    } catch {
      return segment;
    }
  }

  function clear() {
    runInAction(() => {
      part.state.scope = AiDatabaseScope.CurrentDatasource;
      part.state.customObjectIds = [];
    });
  }

  async function configure() {
    const key = options.connectionKey;

    if (!key) {
      return;
    }

    try {
      const connection = await connectionsManagerService.requireConnection(key);

      if (!connection) {
        return;
      }

      connectionInfoAiResource.markOutdated(key);
      await part.load();

      if (part.exception) {
        throw part.exception;
      }

      if (!connectionInfoResource.isConnected(key)) {
        return;
      }

      const rootId = connection.nodePath ?? NodeManagerUtils.connectionIdToConnectionNodeId(key.projectId, key.connectionId);
      const { status, result } = await commonDialogService.open(AiScopeDialog, {
        rootId,
        title: 'plugin_ai_scope_configure',
        selectedIds: part.state.scope === AiDatabaseScope.Custom ? part.state.customObjectIds : [],
      });

      if (status === DialogueStateResult.Resolved && result) {
        runInAction(() => {
          part.state.scope = AiDatabaseScope.Custom;
          part.state.customObjectIds = result;
        });
      }
    } catch (exception: any) {
      notificationService.logException(exception);
    }
  }

  return (
    <div className="theme-border-color-background tw:ml-2 tw:min-w-0 tw:border-l-2 tw:pl-5 tw:flex tw:flex-col tw:gap-3">
      <SelectionSummary
        title={title}
        summary={summary}
        badge={
          custom ? (
            <div
              className="tw:flex tw:h-8 tw:min-w-8 tw:shrink-0 tw:items-center tw:justify-center tw:rounded-full tw:bg-(--theme-primary) tw:px-1 tw:text-(--theme-on-primary) tw:font-semibold"
              aria-label={`${translate('plugin_ai_scope_selected')}: ${count}`}
            >
              {count}
            </div>
          ) : undefined
        }
        active={active}
      >
        {summaryId => (
          <>
            {custom && showSelection && (
              <Button className="tw:uppercase" type="button" variant="ghost" disabled={disabled} aria-describedby={summaryId} onClick={clear}>
                {translate('ui_clear')}
              </Button>
            )}
            <Button
              className="theme-border-color-primary theme-text-primary tw:uppercase"
              type="button"
              variant="secondary"
              disabled={disabled}
              aria-describedby={summaryId}
              loader
              onClick={configure}
            >
              {translate('ui_edit')}
            </Button>
          </>
        )}
      </SelectionSummary>
    </div>
  );
});
