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

import { Filter, FolderExplorer, FolderExplorerPath, Loader, useFocus, useFolderExplorer, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ComponentStyle, composes, useStyles } from '@cloudbeaver/core-theming';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { EObjectFeature } from '../shared/NodesManager/EObjectFeature';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { ElementsTreeLoader } from './ElementsTreeLoader';
import { elementsTreeNameFilter } from './elementsTreeNameFilter';
import type { NavTreeControlComponent } from './NavigationNodeComponent';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import { NavigationTreeService } from './NavigationTreeService';
import type { NavNodeFilterCompareFn } from './NavNodeFilterCompareFn';
import { elementsTreeLimitFilter } from './NavTreeLimitFilter/elementsTreeLimitFilter';
import { elementsTreeLimitRenderer } from './NavTreeLimitFilter/elementsTreeLimitRenderer';
import { ITreeContext, TreeContext } from './TreeContext';
import { IElementsTreeCustomRenderer, IElementsTreeFilter, ITreeNodeState, useElementsTree } from './useElementsTree';

const styles = composes(
  css`
    filter-box {
      composes: theme-background-surface from global;
    }
  `,
  css`
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

    FolderExplorerPath {
      padding: 0 12px 8px 12px;
    }

    filter-box {
      padding: 8px 24px;
      flex: 0 0 auto;
      display: block;
      position: sticky;
      top: 0;
      z-index: 1; 
    }
  `
);

interface Props {
  root?: string;
  limit?: number;
  keepData?: boolean;
  disabled?: boolean;
  selectionTree?: boolean;
  foldersTree?: boolean;
  filter?: boolean;
  filterAll?: boolean;
  showFolderExplorerPath?: boolean;
  localState?: MetadataMap<string, ITreeNodeState>;
  control?: NavTreeControlComponent;
  emptyPlaceholder?: React.FC;
  style?: ComponentStyle;
  className?: string;
  navNodeFilterCompare?: NavNodeFilterCompareFn;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  customSelect?: (node: NavNode, multiple: boolean, nested: boolean) => void;
  beforeSelect?: (node: NavNode, multiple: boolean, nested: boolean) => void;
  isGroup?: (node: NavNode) => boolean;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onClick?: (node: NavNode) => Promise<void> | void;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => void;
  onFilter?: (value: string) => void;
}

export const ElementsTree = observer<Props>(function ElementsTree({
  root: baseRoot = ROOT_NODE_PATH,
  limit,
  control,
  keepData = false,
  disabled,
  localState,
  selectionTree = false,
  showFolderExplorerPath = false,
  foldersTree = false,
  filter = false,
  filterAll = false,
  emptyPlaceholder,
  navNodeFilterCompare,
  filters = [],
  renderers = [],
  style,
  className,
  isGroup,
  beforeSelect,
  customSelect,
  onExpand,
  onClick,
  onOpen,
  onSelect,
  onFilter,
}) {
  const [focusedRef] = useFocus<HTMLDivElement>({ focusFirstChild: true });
  const folderExplorer = useFolderExplorer(baseRoot);
  const navTreeResource = useService(NavTreeResource);
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navigationTreeService = useService(NavigationTreeService);
  const translate = useTranslate();
  
  const root = folderExplorer.folder;
  const fullPath = folderExplorer.fullPath;

  const autoOpenFolders = useCallback(async function autoOpenFolders(nodeId: string, path: string[]) {
    path = [...path];

    if (!tree.foldersTree) {
      return;
    }
    
    while (folderExplorer.options.expandFoldersWithSingleElement) {
      const children = navigationTreeService.getChildren(nodeId);
            
      if (children?.length === 1) {
        const nextNodeId = children[0];
        const loaded = await navigationTreeService.loadNestedNodes(nextNodeId, false);

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
    
  }, []);

  const children = useMapResource(ElementsTree, navTreeResource, root, {
    onLoad: async resource => {
      const preload = await resource.preloadNodeParents(fullPath);

      if (!preload) {
        return false;
      }

      return await autoOpenFolders(root, folderExplorer.path);
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
    foldersTree,
    showFolderExplorerPath,
    root,
    disabled,
    filterAll,
    keepData,
    localState,
    filters: [nameFilter, ...filters, limitFilter],
    renderers: [...renderers, elementsTreeLimitRenderer],
    isGroup,
    onFilter,
    beforeSelect,
    customSelect,
    onExpand,
    onSelect,
  });

  const context = useMemo<ITreeContext>(
    () => ({
      tree,
      folderExplorer,
      selectionTree,
      control,
      onOpen,
      onClick: async (node, path, leaf) => {
        await onClick?.(node);

        if (!leaf && tree.foldersTree) {
          const nodeId = node.id;
          const loaded =  await navigationTreeService.loadNestedNodes(nodeId, true);

          if (loaded) {
            await autoOpenFolders(nodeId, path);
          }
        }
      },
    }),
    [control, selectionTree, onOpen, onClick, folderExplorer]
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

  useEffect(() => {
    if (!foldersTree && folderExplorer.folder !== baseRoot) {
      folderExplorer.open([], baseRoot);
    }
    if (!filter && tree.filter !== '') {
      tree.setFilter('');
    }
  });

  const hasChildren = (children.data?.length || 0) > 0;

  const loaderAvailable = !context.tree.foldersTree || context.folderExplorer.root === root;

  return styled(useStyles(styles, style))(
    <ElementsTreeLoader
      root={root}
      context={context}
      emptyPlaceholder={emptyPlaceholder}
      childrenState={children}
      hasChildren={hasChildren}
      keepData={keepData}
    >
      <TreeContext.Provider value={context}>
        <box className={className}>
          {filter && (
            <filter-box ref={focusedRef} as='div'>
              <Filter
                placeholder={translate('app_navigationTree_search')}
                value={context.tree.filter}
                max
                onFilter={value => context.tree.setFilter(value as string)}
              />
            </filter-box>
          )}
          <FolderExplorer state={folderExplorer}>
            <tree>
              {tree.showFolderExplorerPath && <FolderExplorerPath getName={getName} canSkip={canSkip} />}
              <NavigationNodeNested nodeId={root} component={NavigationNodeElement} path={folderExplorer.path} root />
              {loaderAvailable && <Loader state={[children, tree]} overlay={hasChildren} />}
            </tree>
          </FolderExplorer>
        </box>
      </TreeContext.Provider>
    </ElementsTreeLoader>
  );
});
