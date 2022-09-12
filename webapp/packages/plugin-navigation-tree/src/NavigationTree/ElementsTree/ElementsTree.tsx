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

import { EventTreeNodeClickFlag, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, FolderExplorer, FolderExplorerPath, Loader, TreeNodeNested, TreeNodeNestedMessage, TREE_NODE_STYLES, useFolderExplorer, useMapResource, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { Translate } from '@cloudbeaver/core-localization';
import { type NavNode, ROOT_NODE_PATH, NavTreeResource, NavNodeInfoResource, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

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
import { useDropOutside } from './useDropOutside';
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
    display: flex;
    flex: 1;
    flex-direction: column;
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

    &[|bottom] {
      order: 2;
    }

    &:not([|showDropOutside]) {
      display: none;
    }
    &[|active] {
      border-color: var(--theme-positive) !important;
    }
  }
`;

interface Props extends IElementsTreeOptions {
  root?: string;
  limit?: number;
  selectionTree?: boolean;
  control?: NavTreeControlComponent;
  emptyPlaceholder?: React.FC;
  big?: boolean;
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
  expandStateGetters,
  big,
  style,
  className,
  getChildren,
  loadChildren,
  isGroup,
  beforeSelect,
  customSelect,
  customSelectReset,
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
    if (path.length > 0) {
      folderExplorer.open(path.slice(0, path.length - 1), path[path.length - 1]);
    }
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

  useMapResource(ElementsTree, navTreeResource, root, {
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

  const dndBox = useNavTreeDropBox(navNodeInfoResource.get(root));
  const dropOutside = useDropOutside(dndBox);

  const tree = useElementsTree({
    baseRoot,
    folderExplorer,
    settings,
    root,
    disabled,
    localState,
    filters: [nameFilter, ...filters, limitFilter],
    renderers: [...renderers, elementsTreeLimitRenderer],
    expandStateGetters,
    getChildren,
    loadChildren,
    isGroup,
    onFilter,
    beforeSelect,
    customSelectReset,
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

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    if (EventContext.has(
      event,
      EventTreeNodeExpandFlag,
      EventTreeNodeSelectFlag,
      EventTreeNodeClickFlag,
      EventStopPropagationFlag
    )) {
      return;
    }

    tree.resetSelection();
  }

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

  const children = tree.getNodeChildren(root);
  const hasChildren = children.length > 0;
  const loaderAvailable = !foldersTree || context.folderExplorer.root === root;

  return styled(useStyles(TREE_NODE_STYLES, styles, style))(
    <>
      <ElementsTreeTools tree={tree} style={style} />
      <tree-box {...use({ big })}>
        <ElementsTreeLoader
          root={root}
          context={context}
          emptyPlaceholder={emptyPlaceholder}
          childrenState={tree}
          hasChildren={hasChildren}
        >
          <ElementsTreeContext.Provider value={context}>
            <box className={className}>
              <FolderExplorer state={folderExplorer}>
                <tree ref={dropOutside.mouse.reference} as="div" onClick={handleClick}>
                  {settings?.showFolderExplorerPath && <FolderExplorerPath getName={getName} canSkip={canSkip} />}
                  <drop-outside
                    ref={dndBox.setRef}
                    {...use({
                      showDropOutside: dropOutside.showDropOutside,
                      active: dropOutside.zoneActive,
                      bottom: dropOutside.bottom,
                    })}
                  >
                    <TreeNodeNested root>
                      <TreeNodeNestedMessage><Translate token='app_navigationTree_drop_here' /></TreeNodeNestedMessage>
                    </TreeNodeNested>
                  </drop-outside>
                  <NavigationNodeNested
                    ref={dropOutside.nestedRef}
                    nodeId={root}
                    component={NavigationNodeElement}
                    path={folderExplorer.state.path}
                    root
                  />
                  {loaderAvailable && <Loader state={tree} overlay={hasChildren} />}
                </tree>
              </FolderExplorer>
            </box>
          </ElementsTreeContext.Provider>
        </ElementsTreeLoader>
      </tree-box>
    </>
  );
});
