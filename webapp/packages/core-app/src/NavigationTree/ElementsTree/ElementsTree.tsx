/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo, useCallback, useEffect } from 'react';
import styled, { css } from 'reshadow';

import { Filter, FolderExplorer, FolderExplorerPath, Loader, useFocus, useFolderExplorer, useMapResource, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, composes, useStyles } from '@cloudbeaver/core-theming';

import type { NavNode } from '../../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../../shared/NodesManager/EObjectFeature';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../../shared/NodesManager/NavTreeResource';
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
  }

  FolderExplorerPath {
    padding: 0 12px 8px 12px;
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
  const fullPath = folderExplorer.state.fullPath;

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

  const children = useMapResource(ElementsTree, navTreeResource, root, {
    onLoad: async resource => {
      const preload = await resource.preloadNodeParents(fullPath);

      if (!preload) {
        return false;
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
