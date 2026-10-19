/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo } from 'react';

import {
  Button,
  CommonDialogBody,
  CommonDialogFooter,
  CommonDialogHeader,
  CommonDialogWrapper,
  Translate,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';
import { ConnectionInfoResource, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { EObjectFeature, NavNodeInfoResource, NodeManagerUtils, type NavNode } from '@cloudbeaver/core-navigation-tree';
import {
  Tree,
  type INodeRenderer,
  Node,
  useTreeData,
  type INode,
  NavigationTreeService,
  type ITreeNodeState,
} from '@cloudbeaver/plugin-navigation-tree';
import { useService } from '@cloudbeaver/core-di';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { NotificationService } from '@cloudbeaver/core-events';

import { AIChatConversationScopeCustomNodeControl } from './AIChatConversationScopeCustomNodeControl.js';

interface IDialogPayload {
  connectionKey: IConnectionInfoParams;
  nodes: string[];
  excludedIds: string[];
}

export const AIChatConversationScopeCustomDialog: DialogComponent<IDialogPayload, string[]> = observer(function AIChatConversationScopeCustomDialog({
  payload,
  resolveDialog,
  rejectDialog,
}) {
  const translate = useTranslate();
  const navigationTreeService = useService(NavigationTreeService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const notificationService = useService(NotificationService);

  const key = payload.connectionKey;
  const connectionInfoResource = useResource(AIChatConversationScopeCustomDialog, ConnectionInfoResource, key);
  const root = connectionInfoResource.data?.nodePath ?? NodeManagerUtils.connectionIdToConnectionNodeId(key.projectId, key.connectionId);

  const excludedIds = new Set(payload.excludedIds);
  function isAllowed(nodeId: string) {
    return !excludedIds.has(nodeId) && !navNodeInfoResource.getParents(nodeId).some(parent => excludedIds.has(parent));
  }

  const treeState = useMemo(() => {
    const parents = new Set(payload.nodes.flatMap(nodeId => navNodeInfoResource.getParents(nodeId)));
    return new MetadataMap<string, ITreeNodeState>(nodeId => ({
      showInFilter: false,
      expanded: parents.has(nodeId) || nodeId === root,
      selected: payload.nodes.includes(nodeId),
    }));
  }, [payload.nodes, root, navNodeInfoResource]);

  const nodeRenderers: INodeRenderer[] = useMemo(
    () => [
      (nodeId: string) => {
        const navNode = navNodeInfoResource.get(nodeId);
        if (navNode) {
          return ({ ...props }) => <Node {...props} controlRenderer={AIChatConversationScopeCustomNodeControl} />;
        }
        return null;
      },
    ],
    [navNodeInfoResource],
  );

  const treeData = useTreeData({
    rootId: root ?? '',
    externalState: treeState,
    getNode: (id: string): INode => {
      const navNode = navNodeInfoResource.get(id);
      if (!navNode) {
        throw new Error(`Node ${id} not found`);
      }

      return {
        name: navNode.name || navNode.uri,
        leaf: isLeaf(navNode),
      };
    },
    getChildren: (nodeId: string) => navigationTreeService.getChildren(nodeId) || [],
    childrenTransformers: [(_, nodeId, children) => (isAllowed(nodeId) ? children.filter(isAllowed) : [])],
    getParent: (nodeId: string) => navNodeInfoResource.getParent(nodeId) || null,
    load: async (id: string): Promise<void> => {
      try {
        await navigationTreeService.loadNestedNodes(id);
      } catch (exception: any) {
        notificationService.logException(exception);
        return Promise.reject(exception);
      }
    },
  });

  function apply() {
    const result = [];

    for (const [node, selection] of treeState.entries()) {
      if (selection.selected && isAllowed(node)) {
        result.push(node);
      }
    }

    resolveDialog(result);
  }

  return (
    <CommonDialogWrapper size="large">
      <CommonDialogHeader title="plugin_ai_chat_scope_custom_dialog_title" onReject={rejectDialog} />
      <CommonDialogBody noOverflow noBodyPadding>
        <Tree
          className="tw:max-h-full"
          data={treeData}
          nodeRenderers={nodeRenderers}
          getNodeHeight={() => 30}
          emptyPlaceholder={() => (
            <div className="tw:flex tw:grow tw:items-center tw:justify-center tw:h-full">
              <Translate token="ui_no_items_placeholder" />
            </div>
          )}
        />
      </CommonDialogBody>
      <CommonDialogFooter className="tw:flex tw:justify-between">
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_processing_cancel')}
        </Button>
        <Button type="button" onClick={apply}>
          {translate('ui_apply')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
});

function isLeaf(node: NavNode) {
  return node.objectFeatures.includes(EObjectFeature.entity);
}
