/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, autorun, computed, observable, runInAction } from 'mobx';
import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  getComputed,
  type IFolderExplorerContext,
  useExecutor,
  useObjectRef,
  useObservableRef,
  useResource,
  useUserData,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { type NavNode, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { CachedResourceOffsetPageKey, CachedResourceOffsetPageTargetKey, getNextPageOffset, ResourceKeyUtils } from '@cloudbeaver/core-resource';
import type { IDNDData } from '@cloudbeaver/core-ui';
import { type ILoadableState, MetadataMap, throttle } from '@cloudbeaver/core-utils';

import { ElementsTreeService } from './ElementsTreeService.js';
import type { IElementsTreeAction } from './IElementsTreeAction.js';
import type { INavTreeNodeInfo } from './INavTreeNodeInfo.js';
import type { NavigationNodeRendererComponent } from './NavigationNodeComponent.js';
import { transformNodeInfo } from './transformNodeInfo.js';

export type IElementsTreeCustomRenderer = (nodeId: string) => NavigationNodeRendererComponent | undefined;
export type IElementsTreeCustomNodeInfo = (nodeId: string, info: INavTreeNodeInfo) => INavTreeNodeInfo;

export interface IElementsTreeNodeExpandedInfo {
  expanded: boolean;
  expandable?: boolean;
}

export type IElementsTreeNodeExpandInfoGetter = (tree: IElementsTree, nodeId: string, state: ITreeNodeState) => IElementsTreeNodeExpandedInfo | null;

export type IElementsTreeFilter = (
  tree: IElementsTree,
  filter: string,
  node: NavNode,
  children: string[],
  state: MetadataMap<string, ITreeNodeState>,
) => string[];

export interface ITreeNodeState {
  selected: boolean;
  expanded: boolean;
  showInFilter: boolean;
}

interface IElementsTreeUserState {
  nodeState: Array<[string, ITreeNodeState]>;
  filter: string;
}

export interface IElementsTreeSettings {
  filter: boolean;
  filterAll: boolean;
  saveExpanded: boolean;
  foldersTree: boolean;
  saveFilter: boolean;
  showFolderExplorerPath: boolean;
  configurable: boolean;
  projects: boolean;
  objectsDescription: boolean;
}

export interface IElementsTreeOptions {
  settings?: IElementsTreeSettings;
  disabled?: boolean;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  nodeInfoTransformers?: IElementsTreeCustomNodeInfo[];
  expandStateGetters?: IElementsTreeNodeExpandInfoGetter[];
  /** Allows to pass external state. It can be used to manipulate a tree state from the outside or to store it in an external state */
  localState?: MetadataMap<string, ITreeNodeState>;
  getChildren: (id: string) => string[] | undefined;
  loadChildren: (id: string, manual: boolean) => Promise<boolean>;
  onFilter?: (value: string) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => Promise<void> | void;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onOpen?: (node: NavNode, folder: boolean) => Promise<void> | void;
  onClick?: (node: NavNode) => Promise<void> | void;
  isGroup?: (node: NavNode) => boolean;
  customSelect?: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void> | void;
  beforeSelect?: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void> | void;
  customSelectReset?: () => Promise<void> | void;
}

interface IOptions extends IElementsTreeOptions {
  baseRoot: string;
  root: string;
  folderExplorer: IFolderExplorerContext;
}

export interface IElementsTree extends ILoadableState {
  actions: ISyncExecutor<IElementsTreeAction>;
  settings?: IElementsTreeSettings;
  baseRoot: string;
  root: string;
  readonly filtering: boolean;
  readonly filter: string;
  disabled: boolean;
  activeDnDData: IDNDData[];
  nodeInfoTransformers: IElementsTreeCustomNodeInfo[];
  renderers: IElementsTreeCustomRenderer[];
  state: MetadataMap<string, ITreeNodeState>;
  userData: IElementsTreeUserState;

  getTransformedNodeInfo(node: NavNode): INavTreeNodeInfo;
  getNodeState: (nodeId: string) => ITreeNodeState;
  isNodeExpanded: (nodeId: string, ignoreFilter?: boolean) => boolean;
  isNodeExpandable: (nodeId: string) => boolean;
  getExpanded: () => string[];
  getSelected: () => string[];
  isNodeSelected: (nodeId: string) => boolean;
  isNodeIndeterminateSelected: (nodeId: string) => boolean;
  getNodeChildren: (nodeId: string) => string[];
  isGroup?: (node: NavNode) => boolean;
  setFilter: (value: string) => Promise<void>;
  select: (node: NavNode, multiple: boolean, nested: boolean) => Promise<void>;
  resetSelection(): Promise<void>;
  setDnDData: (data: IDNDData, dragging: boolean) => void;
  open: (node: NavNode, path: string[], leaf: boolean) => Promise<void>;
  click: (node: NavNode, path: string[], leaf: boolean) => Promise<void>;
  expand: (node: NavNode, state: boolean) => Promise<void>;
  show: (nodeId: string, parents: string[]) => Promise<void>;
  refresh: (nodeId: string) => Promise<void>;
  collapse: (nodeId?: string) => void;
  loadPath: (path: string[], lastNode?: string) => Promise<string | undefined>;
}

export function useElementsTree(options: IOptions): IElementsTree {
  const projectsService = useService(ProjectsService);
  const notificationService = useService(NotificationService);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navTreeResource = useService(NavTreeResource);
  const elementsTreeService = useService(ElementsTreeService);

  const [localTreeNodesState] = useState(
    () =>
      new MetadataMap<string, ITreeNodeState>(() => ({
        selected: false,
        expanded: false,
        showInFilter: false,
      })),
  );

  options = useObjectRef(options);
  options.nodeInfoTransformers = useMemo(() => options.nodeInfoTransformers || [], [...(options.nodeInfoTransformers || [])]);
  options.renderers = useMemo(() => options.renderers || [], [...(options.renderers || [])]);
  options.filters = useMemo(() => options.filters || [], [...(options.filters || [])]);
  options.expandStateGetters = useMemo(() => options.expandStateGetters || [], [...(options.expandStateGetters || [])]);
  const state = options.localState || localTreeNodesState;

  async function handleLoadChildren(id: string, manual: boolean): Promise<boolean> {
    try {
      const context = await elementsTreeService.onLoad.execute({ nodeId: id, manual });

      if (ExecutorInterrupter.isInterrupted(context)) {
        return false;
      }

      return await options.loadChildren(id, manual);
    } catch (exception: any) {
      notificationService.logException(exception);
      return false;
    }
  }
  const [loadingNodes] = useState(() => observable.map(new Map<string, Promise<void>>(), { deep: false }));

  const functionsRef = useObjectRef({
    async loadTree(...nodes: string[]) {
      await Promise.all(loadingNodes.values());
      const preloadedRoot = await elementsTree.loadPath(options.folderExplorer.state.fullPath);

      if (preloadedRoot !== options.folderExplorer.state.folder) {
        if (preloadedRoot === undefined) {
          options.folderExplorer.open([], options.baseRoot);
        } else {
          this.exitNodeFolder(preloadedRoot);
        }
        return;
      }

      await this.loadNodes(...nodes);
    },

    async loadNodes(...nodes: string[]) {
      const promises = [];
      for (const nodeId of nodes) {
        const promise = this.loadNode(nodeId).finally(() => loadingNodes.delete(nodeId));
        loadingNodes.set(nodeId, promise);

        promises.push(promise);
      }

      await Promise.all(promises);
    },

    async loadNode(nodeId: string) {
      const expanded = elementsTree.isNodeExpanded(nodeId, true);
      if (!expanded && nodeId !== options.root) {
        if (navNodeInfoResource.isOutdated(nodeId)) {
          const node = navNodeInfoResource.get(nodeId);

          if (node?.parentId !== undefined && !navTreeResource.isOutdated(node.parentId)) {
            await navNodeInfoResource.load(nodeId);
          }
        }
        return;
      }

      const loaded = await handleLoadChildren(nodeId, false);

      if (!loaded) {
        if (expanded) {
          elementsTree.collapse(nodeId);
        }
        return;
      }

      await navNodeInfoResource.load(nodeId);

      const pageInfo = navTreeResource.offsetPagination.getPageInfo(
        CachedResourceOffsetPageKey(0, 0).setParent(CachedResourceOffsetPageTargetKey(nodeId)),
      );

      if (pageInfo) {
        const lastOffset = getNextPageOffset(pageInfo);
        for (let offset = 0; offset < lastOffset; offset += navTreeResource.childrenLimit) {
          await navTreeResource.load(
            CachedResourceOffsetPageKey(offset, navTreeResource.childrenLimit).setParent(CachedResourceOffsetPageTargetKey(nodeId)),
          );
        }
      }

      if (expanded && elementsTree.isNodeExpandable(nodeId) && elementsTree.getNodeChildren(nodeId).length === 0 && !elementsTree.filtering) {
        elementsTree.collapse(nodeId);
        return;
      }

      if (
        elementsTree.settings?.foldersTree &&
        options.folderExplorer.options.expandFoldersWithSingleElement &&
        nodeId === options.root &&
        elementsTree.getNodeChildren(nodeId).length === 1
      ) {
        const nextNode = elementsTree.getNodeChildren(nodeId)[0]!;

        if (elementsTree.isNodeExpandable(nextNode) || elementsTree.isNodeExpanded(nextNode)) {
          options.folderExplorer.open(navNodeInfoResource.getParents(nextNode), nextNode);
        }
      }

      await this.loadNodes(...(navTreeResource.get(nodeId) || []));
    },

    exitNodeFolder(nodeId: string) {
      runInAction(() => {
        const folderExplorer = options.folderExplorer;

        if (folderExplorer.state.fullPath.length === 1 || nodeId === options.baseRoot) {
          return;
        }

        const pathIndex = folderExplorer.state.fullPath.indexOf(nodeId);

        if (pathIndex >= 0) {
          folderExplorer.open(folderExplorer.state.fullPath.slice(0, pathIndex - 1), folderExplorer.state.fullPath[pathIndex - 1]!);
        }
      });
    },

    getNestedChildren(nodeId: string): string[] {
      const nestedChildren: string[] = [];
      const prevChildren = elementsTree.getNodeChildren(nodeId);
      nestedChildren.push(...prevChildren);

      while (prevChildren.length) {
        const nodeKey = prevChildren.shift()!;
        const children = elementsTree.getNodeChildren(nodeKey);
        prevChildren.push(...children);
        nestedChildren.push(...children);
      }

      return nestedChildren;
    },

    async resetSelection() {
      for (const [id, nodeState] of state) {
        if (nodeState.selected) {
          nodeState.selected = false;

          if (options.onSelect) {
            const node = navNodeInfoResource.get(id);

            if (node) {
              await options.onSelect(node, false);
            }
          }
        }
      }
    },

    async clearSelection(nodeId: string) {
      const node = navNodeInfoResource.get(nodeId);

      const ignore = node && options.isGroup?.(node) ? this.getNestedChildren(nodeId) : [];

      for (const [id, nodeState] of state) {
        if (nodeState.selected && id !== nodeId && !ignore.includes(id)) {
          nodeState.selected = false;

          if (options.onSelect) {
            const node = navNodeInfoResource.get(id);

            if (node) {
              await options.onSelect(node, false);
            }
          }
        }
      }
    },
    async setSelection(nodeId: string, selected: boolean): Promise<void> {
      const node = navNodeInfoResource.get(nodeId);

      if (!node) {
        return;
      }

      const treeNodeState = state.get(nodeId);
      const selectionState = elementsTree.isNodeSelected(nodeId);

      if (selectionState === selected) {
        return;
      }

      if (options.isGroup?.(node)) {
        const children = elementsTree.getNodeChildren(nodeId);

        for (const child of children) {
          await this.setSelection(child, selected);
        }

        if (children.length === 0) {
          return;
        }
      } else {
        treeNodeState.selected = selected;
      }

      await options.onSelect?.(node, selected);
    },
  });

  const userData = useUserData<IElementsTreeUserState>(
    `elements-tree-${options.baseRoot}`,
    () =>
      observable<IElementsTreeUserState>({
        nodeState: [],
        filter: '',
      }),
    async data => {
      runInAction(() => {
        if (!options.settings?.saveFilter) {
          data.filter = '';
        }

        if (options.settings?.saveExpanded) {
          state.sync(data.nodeState);
        } else {
          state.unSync();
          state.clear();
        }
      });

      try {
        await functionsRef.loadTree(options.root);
      } catch {}
    },
    data => typeof data === 'object' && typeof data.filter === 'string' && Array.isArray(data.nodeState),
  );

  useEffect(
    () =>
      autorun(() => {
        if (options.settings?.saveExpanded) {
          runInAction(() => {
            userData.nodeState = Array.from(state);
            state.sync(userData.nodeState);
          });
        } else {
          state.unSync();
        }
      }),
    [state, userData, options.settings],
  );

  const elementsTree = useObservableRef<IElementsTree>(
    () => ({
      actions: new SyncExecutor(),
      activeDnDData: [],
      get filter(): string {
        return this.userData.filter;
      },
      get filtering(): boolean {
        return this.filter !== '';
      },
      isLoading(): boolean {
        return loadingNodes.size > 0;
      },
      isLoaded(): boolean {
        return navNodeInfoResource.isLoaded(this.root);
      },
      isOutdated(): boolean {
        return navNodeInfoResource.isOutdated(this.root);
      },
      getNodeState(nodeId: string) {
        return this.state.get(nodeId);
      },
      getTransformedNodeInfo(node: NavNode): INavTreeNodeInfo {
        return transformNodeInfo(node, this.nodeInfoTransformers);
      },
      isNodeExpanded(nodeId: string, ignoreFilter?: boolean): boolean {
        if (nodeId === this.root) {
          return true;
        }

        if (this.filtering && this.settings?.filterAll && !ignoreFilter) {
          return this.getNodeChildren(nodeId).length > 0;
        }

        const nodeState = this.getNodeState(nodeId);
        const expanded = nodeState.expanded || nodeState.showInFilter;

        if (!expanded && options.expandStateGetters?.length) {
          return options.expandStateGetters
            .map(getExpandState => getExpandState(this, nodeId, nodeState))
            .filter(stateInfo => stateInfo !== null)
            .some(stateInfo => stateInfo?.expanded);
        }

        return expanded;
      },
      isNodeExpandable(nodeId: string): boolean {
        if (nodeId === this.root) {
          return false;
        }

        if (options.expandStateGetters?.length) {
          const nodeState = this.getNodeState(nodeId);

          return options.expandStateGetters
            .map(getExpandState => getExpandState(this, nodeId, nodeState))
            .filter(stateInfo => stateInfo !== null)
            .every(stateInfo => stateInfo?.expandable !== false);
        }

        return true;
      },
      getExpanded(): string[] {
        return Array.from(this.state)
          .filter(([key, state]) => state.expanded)
          .map(([key]) => key);
      },
      getSelected(): string[] {
        return Array.from(this.state)
          .filter(([key, state]) => state.selected)
          .map(([key]) => key);
      },
      isNodeSelected(nodeId: string): boolean {
        const node = navNodeInfoResource.get(nodeId);

        if (node && elementsTree.isGroup?.(node)) {
          const children = this.getNodeChildren(nodeId);

          if (children.length > 0) {
            return children.every(child => this.isNodeSelected(child));
          }

          return false;
        }

        return this.getNodeState(nodeId).selected;
      },
      isNodeIndeterminateSelected(nodeId: string): boolean {
        if (this.isNodeSelected(nodeId)) {
          return false;
        }

        const node = navNodeInfoResource.get(nodeId);

        if (node && elementsTree.isGroup?.(node)) {
          const children = options.getChildren(nodeId) || [];

          if (children.length > 0) {
            return children.some(child => this.isNodeSelected(child) || this.isNodeIndeterminateSelected(child));
          }

          return false;
        }

        return false;
      },
      getNodeChildren(nodeId: string): string[] {
        const node = navNodeInfoResource.get(nodeId);
        const children = options.getChildren(nodeId) || [];

        if (!node) {
          return []; // Maybe filter should accept nodeId, so we be able to apply filters to empty node
        }

        return (options.filters || []).reduce((children, filter) => filter(elementsTree, elementsTree.filter, node, children, this.state), children);
      },
      async setFilter(value: string) {
        runInAction(() => {
          this.userData.filter = value;

          for (const nodeState of this.state.values()) {
            nodeState.showInFilter = false;
          }
        });

        await options.onFilter?.(value);
      },
      async collapse(nodeId?: string) {
        if (nodeId !== undefined) {
          if (!this.isNodeExpandable(nodeId)) {
            return;
          }

          const treeNodeState = this.state.get(nodeId);

          treeNodeState.expanded = false;
          treeNodeState.showInFilter = false;
          return;
        }

        for (const state of this.state.values()) {
          state.expanded = false;
          state.showInFilter = false;
        }
      },
      async refresh(nodeId: string): Promise<void> {
        try {
          await navTreeResource.refreshNode(nodeId);
        } catch (exception: any) {
          notificationService.logException(exception, 'app_navigationTree_refresh_error');
        }
      },
      async show(nodeId: string, path: string[]): Promise<void> {
        if (!path.includes(this.baseRoot)) {
          return;
        }

        const preloaded = await this.loadPath(path, nodeId);

        if (preloaded !== nodeId) {
          notificationService.logError({
            title: 'app_navigationTree_node_not_found',
            message: nodeId,
          });
        } else {
          runInAction(() => {
            for (const parent of path) {
              const state = this.getNodeState(parent);
              state.expanded = true;
            }

            const node = navNodeInfoResource.get(nodeId)!;

            this.select(node, false, false);
            this.actions.execute({ type: 'show', nodeId });
          });

          if (path.length > 0) {
            await functionsRef.loadTree(path[0]!);
          }
        }
      },
      async click(node: NavNode, path: string[], leaf: boolean) {
        await options.onClick?.(node);
      },
      async open(node: NavNode, path: string[], leaf: boolean) {
        const expandableOrExpanded = this.isNodeExpandable(node.id) || this.isNodeExpanded(node.id);
        if (!leaf && this.settings?.foldersTree && expandableOrExpanded) {
          const nodeId = node.id;

          const loaded = await handleLoadChildren(node.id, false);
          if (loaded) {
            this.setFilter('');
            options.folderExplorer.open(path, nodeId);
          }
        }

        const folder = (!leaf && this.settings?.foldersTree) || false;
        await options.onOpen?.(node, folder);
      },
      async expand(node: NavNode, state: boolean) {
        if (!this.isNodeExpandable(node.id)) {
          return;
        }

        const treeNodeState = this.state.get(node.id);

        try {
          if (state || (this.filtering && !treeNodeState.showInFilter)) {
            state = await handleLoadChildren(node.id, true);
          }

          if (this.filtering) {
            treeNodeState.showInFilter = !treeNodeState.showInFilter && state;

            if (!treeNodeState.showInFilter) {
              const nested = functionsRef.getNestedChildren(node.id);

              for (const nodeId of nested) {
                const treeNodeState = this.state.get(nodeId);
                treeNodeState.showInFilter = false;
              }
            }
          } else {
            await options.onExpand?.(node, state);
            treeNodeState.expanded = state && this.getNodeChildren(node.id).length > 0;
          }

          if (state) {
            await functionsRef.loadTree(node.id);
          }
        } catch {
          treeNodeState.expanded = false;

          if (this.filtering) {
            treeNodeState.showInFilter = false;
          }
        }
      },
      async select(node: NavNode, multiple: boolean, nested: boolean) {
        if (options.customSelect) {
          await options.customSelect(node, multiple, nested);
          return;
        }

        if (options.beforeSelect) {
          await options.beforeSelect(node, multiple, nested);
        }

        const selected = this.isNodeSelected(node.id);

        if (!multiple) {
          await functionsRef.clearSelection(node.id);

          if (selected) {
            return;
          }
        }

        await functionsRef.setSelection(node.id, !selected);
      },
      async resetSelection(): Promise<void> {
        if (options.customSelectReset) {
          await options.customSelectReset();
          return;
        }
        await functionsRef.resetSelection();
      },
      async loadPath(path: string[], lastNode?: string): Promise<string | undefined> {
        let lastLoadedNode: string | undefined;
        for (const nodeId of path) {
          const loaded = await handleLoadChildren(nodeId, false);

          if (!loaded) {
            return lastLoadedNode;
          }
          lastLoadedNode = nodeId;
        }

        if (lastNode !== undefined && lastLoadedNode !== undefined && options.getChildren(lastLoadedNode)?.includes(lastNode)) {
          return lastNode;
        }

        return lastLoadedNode;
      },
      setDnDData(data: IDNDData, dragging: boolean) {
        if (dragging) {
          if (!this.activeDnDData.includes(data)) {
            this.activeDnDData.push(data);
          }
        } else {
          this.activeDnDData = this.activeDnDData.filter(d => d !== data);
        }
      },
    }),
    {
      state: observable.ref,
      settings: observable.ref,
      isGroup: observable.ref,
      disabled: observable.ref,
      activeDnDData: observable.shallow,
      root: observable.ref,
      filter: computed,
      filtering: computed,
      renderers: observable.ref,
      nodeInfoTransformers: observable.ref,
      baseRoot: observable.ref,
      collapse: action.bound,
      userData: observable.ref,
    },
    {
      state,
      isGroup: options.isGroup,
      disabled: options.disabled,
      root: options.root,
      settings: options.settings,
      baseRoot: options.baseRoot,
      renderers: options.renderers,
      nodeInfoTransformers: options.nodeInfoTransformers,
      userData,
    },
    ['isLoaded'],
  );

  useEffect(() => {
    functionsRef.loadTree(options.root).catch(() => ({}));
  }, [options.root]);

  const loadTreeThreshold = useCallback(
    throttle(function refreshRoot() {
      functionsRef.loadTree(options.root).catch(() => ({}));
    }, 100),
    [],
  );

  useResource(useElementsTree, navTreeResource, options.baseRoot, {
    onData: () => loadTreeThreshold(),
  });

  useExecutor({
    executor: navNodeInfoResource.onDataOutdated,
    postHandlers: [loadTreeThreshold],
  });

  // TODO: trigger nav tree sync (navigationTreeProjectsExpandStateGetter is returning new state)
  //       we want to have abstraction
  useExecutor({
    executor: projectsService.onActiveProjectChange,
    handlers: [
      data => {
        if (data.type === 'after') {
          loadTreeThreshold();
        }
      },
    ],
  });

  useExecutor({
    executor: navNodeInfoResource.onItemDelete,
    handlers: [
      function deleteNodeState(key) {
        runInAction(() => {
          if (!options.settings?.saveExpanded) {
            ResourceKeyUtils.forEach(key, key => {
              state.delete(key);
            });
          }
        });
      },
    ],
  });

  useExecutor({
    executor: navTreeResource.onItemUpdate,
    handlers: [
      function exitFolder(key) {
        ResourceKeyUtils.forEach(key, key => {
          const children = navTreeResource.get(key);

          if (!children) {
            functionsRef.exitNodeFolder(key);
          }
        });
      },
    ],
  });

  useExecutor({
    executor: navTreeResource.onItemDelete,
    handlers: [
      async function collapseDeletedTree(key) {
        await ResourceKeyUtils.forEachAsync(key, async key => {
          const node = navNodeInfoResource.get(key);

          if (node) {
            await elementsTree.expand(node, false);

            functionsRef.exitNodeFolder(key);
          }
        });
      },
    ],
  });

  // sync settings
  const filterDisabled = getComputed(() => !options.settings?.filter && elementsTree.filtering);

  useEffect(() => {
    if (filterDisabled) {
      elementsTree.setFilter('');
    }
  });

  return elementsTree;
}
