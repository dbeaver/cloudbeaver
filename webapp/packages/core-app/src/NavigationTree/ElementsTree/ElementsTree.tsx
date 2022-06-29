/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo, useCallback, useEffect } from 'react';
import styled, { css, use } from 'reshadow';

import { FolderExplorer, FolderExplorerPath, getComputed, Loader, useFolderExplorer, useMapResource, useObjectRef, useStateDelay } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { getNodesFromContext } from '../../shared/NodesManager/getNodesFromContext';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../../shared/NodesManager/NavTreeResource';
import { useNavTreeDropBox } from '../useNavTreeDropBox';
import { IElementsTreeContext, ElementsTreeContext } from './ElementsTreeContext';
import { ElementsTreeLoader } from './ElementsTreeLoader';
import { elementsTreeNameFilter } from './elementsTreeNameFilter';
import { ElementsTreeTools } from './ElementsTreeTools/ElementsTreeTools';
import type { NavTreeControlComponent } from './NavigationNodeComponent';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import type { NavNodeFilterCompareFn } from './NavNodeFilterCompareFn';
import { elementsTreeLimitFilter } from './NavTreeLimitFilter/elementsTreeLimitFilter';
import { elementsTreeLimitRenderer } from './NavTreeLimitFilter/elementsTreeLimitRenderer';
import { IElementsTreeOptions, useElementsTree } from './useElementsTree';

const styles = css`
  box {
    display: flex;
    flex-direction: column;
    box-sizing: border-box;
  }

  tree {
    position: relative;
    box-sizing: border-box;
    flex: 1;
  }
  
  tree-box {
    flex: 1;
    overflow: auto;
    display: flex;
  }

  FolderExplorerPath {
    padding: 0 12px 8px 12px;
  }

  drop-outside {
    composes: theme-border-color-background from global;
    border: dashed 2px;
    border-radius: 3px;
    margin: 12px;
    box-sizing: border-box;
    position: relative;

    &:not([|showDropOutside]) {
      display: none;
    }
  }
`;

interface Props extends IElementsTreeOptions {
  root?: string;
  limit?: number;
  selectionTree?: boolean;
  control?: NavTreeControlComponent;
  emptyPlaceholder?: React.FC;
  style?: ComponentStyle;
  className?: string;
  navNodeFilterCompare?: NavNodeFilterCompareFn;
  onClick?: (node: NavNode) => Promise<void> | void;
  onOpen?: (node: NavNode, folder: boolean) => Promise<void> | void;
}

export const ElementsTree = observer<Props>(function ElementsTree({
  root: baseRoot = ROOT_NODE_PATH,
  limit,
  control,
  settings,
  disabled,
  localState,
  selectionTree = false,
  emptyPlaceholder,
  navNodeFilterCompare,
  filters = [],
  renderers = [],
  style,
  className,
  getChildren,
  loadChildren,
  isGroup,
  beforeSelect,
  customSelect,
  onExpand,
  onClick,
  onOpen,
  onSelect,
  onFilter,
}) {
  const folderExplorer = useFolderExplorer(baseRoot, {
    saveState: settings?.saveExpanded,
  });
  const navTreeResource = useService(NavTreeResource);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const ref = useObjectRef({ settings, getChildren, loadChildren });

  const root = folderExplorer.state.folder;

  function exitFolders(path: string[]) {
    path = path.filter(nodeId => ref.getChildren(nodeId) !== undefined);
    folderExplorer.open(path.slice(0, path.length - 1), path[path.length - 1]);
  }

  const autoOpenFolders = useCallback(async function autoOpenFolders(nodeId: string, path: string[]) {
    path = [...path];

    if (!ref.settings?.foldersTree && !folderExplorer.options.expandFoldersWithSingleElement) {
      return;
    }

    while (folderExplorer.options.expandFoldersWithSingleElement) {
      const children = ref.getChildren(nodeId);

      if (children?.length === 1) {
        const nextNodeId = children[0];
        const loaded = await ref.loadChildren(nextNodeId, false);

        if (!loaded) {
          break;
        }

        path.push(nodeId);
        nodeId = nextNodeId;
      } else {
        break;
      }
    }

    folderExplorer.open(path, nodeId);

  }, [folderExplorer]);

  const rootNode = useMapResource(ElementsTree, navNodeInfoResource, root);

  const children = useMapResource(ElementsTree, navTreeResource, root, {
    onLoad: async resource => {
      let fullPath = folderExplorer.state.fullPath;
      const preload = await resource.preloadNodeParents(fullPath);

      if (!preload) {
        fullPath = folderExplorer.state.fullPath;
        exitFolders(fullPath);
        return true;
      }

      return await autoOpenFolders(root, folderExplorer.state.path);
    },
  });

  const limitFilter = useMemo(() => elementsTreeLimitFilter(
    navTreeResource,
    limit
  ), [navTreeResource, limit]);

  const nameFilter = useMemo(() => elementsTreeNameFilter(
    navTreeResource,
    navNodeInfoResource,
    navNodeFilterCompare
  ), [navTreeResource, navNodeInfoResource, navNodeFilterCompare]);

  const dndBox = useNavTreeDropBox(rootNode.data);

  const tree = useElementsTree({
    baseRoot,
    folderExplorer,
    settings,
    root,
    disabled,
    localState,
    filters: [nameFilter, ...filters, limitFilter],
    renderers: [...renderers, elementsTreeLimitRenderer],
    getChildren,
    loadChildren,
    isGroup,
    onFilter,
    beforeSelect,
    customSelect,
    onExpand,
    onSelect,
  });

  const context = useMemo<IElementsTreeContext>(
    () => ({
      tree,
      folderExplorer,
      selectionTree,
      control,
      onOpen: async (node, path, leaf) => {
        const folder = !leaf && tree.settings?.foldersTree || false;

        await onOpen?.(node, folder);

        if (!leaf && tree.settings?.foldersTree) {
          const nodeId = node.id;
          const loaded =  await ref.loadChildren(nodeId, true);

          if (loaded) {
            await autoOpenFolders(nodeId, path);
            tree.setFilter('');
          }
        }
      },
      onClick,
    }),
    [control, folderExplorer, selectionTree, onOpen, onClick, folderExplorer]
  );

  const getName = useCallback(
    (folder: string) => navNodeInfoResource.get(folder)?.name || 'Not found',
    [navNodeInfoResource]
  );

  const canSkip = useCallback(
    (folder: string) => {
      const features = navNodeInfoResource.get(folder)?.objectFeatures;
      return !(
        features?.includes(EObjectFeature.schema)
        || features?.includes(EObjectFeature.catalog)
        || features?.includes(EObjectFeature.dataSource)
      );
    },
    [navNodeInfoResource]
  );

  const foldersTree = settings?.foldersTree; // mobx subscription
  const filter = settings?.filter;

  useEffect(() => {
    if (!foldersTree && folderExplorer.state.folder !== baseRoot) {
      folderExplorer.open([], baseRoot);
    }
    if (!filter && tree.filtering) {
      tree.setFilter('');
    }
  });

  let showDropOutside = getComputed(() => !!dndBox.state.context && dndBox.state.canDrop);
  showDropOutside = useStateDelay(showDropOutside, 100);
  const isOverCurrent = useStateDelay(dndBox.state.isOverCurrent, 100);

  let dndNodes: string[] | undefined;
  if (dndBox.state.context && showDropOutside && isOverCurrent) {
    dndNodes = getNodesFromContext(dndBox.state.context)
      .map(node => node.id);
  }

  const hasChildren = (children.data?.length || 0) > 0;
  const loaderAvailable = !foldersTree || context.folderExplorer.root === root;

  return styled(useStyles(styles, style))(
    <>
      <ElementsTreeTools tree={tree} style={style} />
      <tree-box>
        <ElementsTreeLoader
          root={root}
          context={context}
          emptyPlaceholder={emptyPlaceholder}
          childrenState={children}
          hasChildren={hasChildren}
        >
          <ElementsTreeContext.Provider value={context}>
            <box className={className}>
              <FolderExplorer state={folderExplorer}>
                <tree>
                  {settings?.showFolderExplorerPath && <FolderExplorerPath getName={getName} canSkip={canSkip} />}
                  <drop-outside ref={dndBox.setRef} {...use({ showDropOutside })}>
                    <NavigationNodeNested
                      component={NavigationNodeElement}
                      path={folderExplorer.state.path}
                      dndNodes={dndNodes}
                      root
                    />
                  </drop-outside>
                  <NavigationNodeNested
                    nodeId={root}
                    component={NavigationNodeElement}
                    path={folderExplorer.state.path}
                    root
                  />
                  {loaderAvailable && <Loader state={[children, tree]} overlay={hasChildren} />}
                </tree>
              </FolderExplorer>
            </box>
          </ElementsTreeContext.Provider>
        </ElementsTreeLoader>
      </tree-box>
    </>
  );
});
