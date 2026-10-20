/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo, useState } from 'react';
import { runInAction } from 'mobx';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Filter,
  Translate,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { hasMorePagesForResourceKey } from '@cloudbeaver/core-resource';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { NavigationTreeService, Tree, useTreeData, type INodeRenderer, type ITreeNodeState } from '@cloudbeaver/plugin-navigation-tree';

import { useAiScopeSelection } from './useAiScopeSelection.js';
import { AiScopeNode } from './AiScopeNode.js';
import { AiScopeMoreNode } from './AiScopeMoreNode.js';
import { isScopeLeaf } from './isScopeLeaf.js';
import { isScopeObject } from './isScopeObject.js';
import { MORE_PREFIX } from './MORE_PREFIX.js';
import { useScopeFilter } from './useScopeFilter.js';
import { AiScopeFilterMenu } from './AiScopeFilterMenu.js';
import type { IAiScopeDialogPayload } from './IAiScopeDialogPayload.js';
import { getScopeSelectionRoots } from './getScopeSelectionRoots.js';

export const AiScopeDialog: DialogComponent<IAiScopeDialogPayload, string[]> = observer(function AiScopeDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const navigationTreeService = useService(NavigationTreeService);
  const notificationService = useService(NotificationService);

  useResource(AiScopeDialog, navNodeInfoResource, payload.rootId, { forceSuspense: true });

  function isAllowed(id: string) {
    return (
      payload.allowedIds == null ||
      payload.allowedIds.some(
        allowed => allowed === id || navNodeInfoResource.getParents(id).includes(allowed) || navNodeInfoResource.getParents(allowed).includes(id),
      )
    );
  }

  const [treeState] = useState(() => {
    const parents = new Set(payload.selectedIds.filter(isAllowed).flatMap(id => navNodeInfoResource.getParents(id)));
    return new MetadataMap<string, ITreeNodeState>(id => ({
      expanded: parents.has(id) || id === payload.rootId,
      selected: false,
      showInFilter: false,
    }));
  });
  const selection = useAiScopeSelection({
    selectedIds: payload.selectedIds.filter(isAllowed),
    allObjects: false,
    getParents: id => navNodeInfoResource.getParents(id),
    canSelect: id => isAllowed(id) && isScopeObject(navNodeInfoResource.get(id)),
  });
  const filter = useScopeFilter(payload.rootId, isAllowed);
  const renderers: INodeRenderer[] = useMemo(
    () => [
      id => {
        if (id.startsWith(MORE_PREFIX)) {
          return AiScopeMoreNode;
        }
        return AiScopeNode;
      },
    ],
    [],
  );

  const data = useTreeData({
    rootId: payload.rootId,
    externalState: treeState,
    getNode(id) {
      if (id.startsWith(MORE_PREFIX)) {
        return { name: translate('ui_load_more'), leaf: true };
      }
      const node = navNodeInfoResource.get(id)!;
      return { name: node.name || node.uri, leaf: isScopeLeaf(node) };
    },
    getParent: id => (id.startsWith(MORE_PREFIX) ? id.slice(MORE_PREFIX.length) : (navNodeInfoResource.getParent(id) ?? null)),
    getChildren(id) {
      const node = navNodeInfoResource.get(id);
      if (!node || isScopeLeaf(node) || !isAllowed(id)) {
        return [];
      }
      const children = (navigationTreeService.getChildren(id) ?? []).filter(isAllowed);
      return hasMorePagesForResourceKey(navTreeResource, id) ? [...children, MORE_PREFIX + id] : children;
    },
    childrenTransformers: [
      (_, id, children) => children.filter(child => child.startsWith(MORE_PREFIX) || !filter.result || filter.result.visible.has(child)),
    ],
    stateTransformers: [(_, id, state) => (filter.result?.expanded.has(id) ? { ...state, expanded: true } : state)],
    async load(id) {
      const node = navNodeInfoResource.get(id);
      if (id.startsWith(MORE_PREFIX) || !isAllowed(id) || (node && isScopeLeaf(node))) {
        return;
      }
      try {
        if (!(await navigationTreeService.loadNestedNodes(id))) {
          notificationService.logException(new Error(translate('plugin_ai_scope_load_error')));
        }
      } catch (exception: any) {
        notificationService.logException(exception);
      }
    },
  });

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title={payload.title} onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <div className="tw:flex tw:flex-col tw:min-h-0 tw:h-full">
          <div className="tw:flex tw:flex-col tw:gap-2 tw:px-4 tw:py-3">
            <div className="tw:flex tw:items-center tw:gap-2">
              <Filter
                className="tw:flex-1 tw:min-w-0"
                placeholder={translate('plugin_ai_scope_search')}
                aria-label={translate('plugin_ai_scope_search')}
                value={filter.query}
                onChange={value =>
                  runInAction(() => {
                    filter.query = value;
                  })
                }
              />
              <AiScopeFilterMenu filter={filter} />
            </div>
          </div>
          <Tree
            className="tw:min-h-64 tw:max-h-full tw:grow"
            data={data}
            selection={selection}
            nodeRenderers={renderers}
            getNodeHeight={() => 30}
            emptyPlaceholder={() => (
              <div className="tw:p-4">
                <Translate token="ui_no_items_placeholder" />
              </div>
            )}
          />
        </div>
      </CommonDialogBody>
      <CommonDialogFooter className="tw:flex tw:justify-between">
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_cancel')}
        </Button>
        <Button
          type="button"
          onClick={() =>
            resolveDialog(getScopeSelectionRoots([...selection.selectedIds].filter(isAllowed), id => navNodeInfoResource.getParents(id)).sort())
          }
        >
          {translate('ui_apply')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});
