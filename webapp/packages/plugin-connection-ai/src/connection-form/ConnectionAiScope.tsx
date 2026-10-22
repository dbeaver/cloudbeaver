/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { runInAction } from 'mobx';

import { useAutoLoad, useTranslate } from '@cloudbeaver/core-blocks';
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { EObjectFeature, NavNodeInfoResource, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { AiDatabaseScope } from '@cloudbeaver/core-sdk';
import type { ConnectionFormAiContainerProps } from './ConnectionFormAiService.js';
import { getConnectionFormOptionsPart } from '@cloudbeaver/plugin-connections';
import { AiScopeDialog } from '../connection-custom-scope/AiScopeDialogLazy.js';
import { getScopeSelectionRoots } from '../connection-custom-scope/getScopeSelectionRoots.js';

import { getConnectionAiScopePart } from './getConnectionAiScopePart.js';
import { SelectionSummary } from './SelectionSummary.js';

export const ConnectionAiScope = observer<ConnectionFormAiContainerProps>(function ConnectionAiScope({ formState, metaTransferConfirmed = false }) {
  const translate = useTranslate();
  const part = getConnectionAiScopePart(formState);
  const options = getConnectionFormOptionsPart(formState);
  const connectionsManagerService = useService(ConnectionsManagerService);
  const commonDialogService = useService(CommonDialogService);
  const notificationService = useService(NotificationService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  useAutoLoad(ConnectionAiScope, [part]);

  const disabled = !options.connectionKey || !part.isLoaded() || formState.isDisabled || formState.isReadOnly || part.isReadOnly || part.isError();
  const custom = part.state.scope === AiDatabaseScope.Custom;
  const selectedIds = custom ? getScopeSelectionRoots(part.state.customObjectIds, id => navNodeInfoResource.getParents(id)) : [];
  const previewIds = selectedIds.slice(0, 3);
  const remaining = selectedIds.length - previewIds.length;
  const showSelection = !!options.connectionKey && part.isLoaded() && !part.isError();
  const active = showSelection && metaTransferConfirmed && selectedIds.length > 0;
  const title = translate(active ? 'plugin_ai_scope_custom_active' : 'plugin_ai_scope_custom');
  let count: number | string = '—';
  if (showSelection) {
    count = selectedIds.length;
  }
  let summary = '';
  if (!options.connectionKey) {
    summary = translate('plugin_ai_scope_save_first');
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
        count={custom ? count : undefined}
        countLabel={`${translate('plugin_ai_scope_selected')}: ${selectedIds.length}`}
        active={active}
        clearAction={custom ? { label: translate('ui_clear'), disabled, onClick: clear } : undefined}
        editAction={{ label: translate(custom ? 'ui_edit' : 'plugin_ai_scope_configure_action'), disabled, onClick: configure }}
      />
      {showSelection && part.isChanged && (
        <div className="tw:text-xs tw:text-(--theme-text-hint-on-light)" role="status">
          {translate('plugin_ai_scope_unsaved')}
        </div>
      )}
    </div>
  );
});
