/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback, useImperativeHandle, useMemo, useState } from 'react';

import {
  EventTreeNodeClickFlag,
  EventTreeNodeExpandFlag,
  EventTreeNodeSelectFlag,
  FolderExplorer,
  FolderExplorerPath,
  type PlaceholderElement,
  s,
  Translate,
  TreeNodeNested,
  TreeNodeNestedMessage,
  useMergeRefs,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { EObjectFeature, isProjectNode, type NavNode, NavNodeInfoResource, NavTreeResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import { DNDScrollContainer } from '@cloudbeaver/core-ui';

import { useNavTreeDropBox } from '../useNavTreeDropBox.js';
import style from './ElementsTree.module.css';
import { ElementsTreeContentLoader } from './ElementsTreeContentLoader.js';
import { ElementsTreeContext, type IElementsTreeContext } from './ElementsTreeContext.js';
import { elementsTreeNameFilter } from './elementsTreeNameFilter.js';
import { ElementsTreeTools } from './ElementsTreeTools/ElementsTreeTools.js';
import type { IElementsTreeSettingsProps } from './ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService.js';
import type { NavTreeControlComponent } from './NavigationNodeComponent.js';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested.js';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement.js';
import type { NavNodeFilterCompareFn } from './NavNodeFilterCompareFn.js';
import { elementsTreeLimitFilter } from './NavTreeLimitFilter/elementsTreeLimitFilter.js';
import { elementsTreeLimitRenderer } from './NavTreeLimitFilter/elementsTreeLimitRenderer.js';
import { useDropOutside } from './useDropOutside.js';
import { type IElementsTree, type IElementsTreeOptions, useElementsTree } from './useElementsTree.js';
import { useElementsTreeFolderExplorer } from './useElementsTreeFolderExplorer.js';
import { useTreeKeyboardNavigation } from '../../useTreeKeyboardNavigation.js';

export interface ElementsTreeProps extends IElementsTreeOptions, React.PropsWithChildren {
  /** Specifies the root path for the tree. ROOT_NODE_PATH will be used if not defined */
  root?: string;
  selectionTree?: boolean;
  /** Specifies a custom control component for navigation tree */
  control?: NavTreeControlComponent;
  /** A placeholder component to be displayed when the elements tree is empty */
  emptyPlaceholder?: React.FC;
  className?: string;
  settingsElements?: PlaceholderElement<IElementsTreeSettingsProps>[];
  navNodeFilterCompare?: NavNodeFilterCompareFn;
  onClick?: (node: NavNode) => Promise<void> | void;
  onOpen?: (node: NavNode, folder: boolean) => Promise<void> | void;
}

export const ElementsTree = observer(
  forwardRef<IElementsTree, ElementsTreeProps>(function ElementsTree(
    {
      root: baseRoot = ROOT_NODE_PATH,
      control,
      settings,
      disabled,
      localState,
      selectionTree = false,
      emptyPlaceholder,
      navNodeFilterCompare,
      nodeInfoTransformers = [],
      filters = [],
      renderers = [],
      expandStateGetters,
      settingsElements,
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
    },
    ref,
  ) {
    const styles = useS(style);
    const translate = useTranslate();
    const navTreeResource = useService(NavTreeResource);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const [treeRootRef, setTreeRootRef] = useState<HTMLDivElement | null>(null);
    const folderExplorer = useElementsTreeFolderExplorer(baseRoot, settings);

    const root = folderExplorer.state.folder;

    const limitFilter = useMemo(() => elementsTreeLimitFilter(navTreeResource), [navTreeResource]);

    const nameFilter = useMemo(
      () => elementsTreeNameFilter(navTreeResource, navNodeInfoResource, navNodeFilterCompare),
      [navTreeResource, navNodeInfoResource, navNodeFilterCompare],
    );

    const dndBox = useNavTreeDropBox(navNodeInfoResource.get(root));
    const dropOutside = useDropOutside(dndBox);

    const tree = useElementsTree({
      baseRoot,
      folderExplorer,
      settings,
      root,
      disabled,
      localState,
      nodeInfoTransformers,
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
      onOpen,
      onClick,
    });
    const treeKeyboardNavigation = useTreeKeyboardNavigation({
      getParent(nodeId) {
        if (nodeId === root) {
          return null;
        }

        return navNodeInfoResource.get(nodeId)?.parentId ?? null;
      },
      getChildren: nodeId => tree.getNodeChildren(nodeId),
      isExpanded: nodeId => tree.isNodeExpanded(nodeId),
      isLeaf(nodeId) {
        const node = navNodeInfoResource.get(nodeId);
        const children = navTreeResource.get(nodeId);
        const outdated = navNodeInfoResource.isOutdated(nodeId) || navTreeResource.isOutdated(nodeId);

        return (
          !node ||
          !node.hasChildren ||
          (!tree.settings?.showTableContents && node.objectFeatures.includes(EObjectFeature.entity)) ||
          (children?.length === 0 && !outdated)
        );
      },
      isFocusable(nodeId) {
        const node = navNodeInfoResource.get(nodeId);
        return nodeId !== root && !!node && (tree.settings?.projects !== false || !isProjectNode(node));
      },
      disabled: tree.disabled,
      async setExpanded(nodeId, expanded) {
        const node = navNodeInfoResource.get(nodeId);

        if (node) {
          await tree.expand(node, expanded);
        }
      },
      activateNode: onOpen
        ? async nodeId => {
            const node = navNodeInfoResource.get(nodeId);

            if (node) {
              await tree.open(node, [], false);
            }
          }
        : undefined,
    });
    const treeMergedRef = useMergeRefs<HTMLDivElement>(setTreeRootRef);

    useImperativeHandle(ref, () => tree, [tree]);

    const context = useMemo<IElementsTreeContext>(
      () => ({
        tree,
        folderExplorer,
        selectionTree,
        control,
        getTreeRoot: () => treeRootRef,
      }),
      [tree, folderExplorer, selectionTree, control, treeRootRef],
    );

    const getName = useCallback((folder: string) => navNodeInfoResource.get(folder)?.name || 'Not found', [navNodeInfoResource]);

    const canSkip = useCallback(
      (folder: string) => {
        const features = navNodeInfoResource.get(folder)?.objectFeatures;
        return !(
          features?.includes(EObjectFeature.schema) ||
          features?.includes(EObjectFeature.catalog) ||
          features?.includes(EObjectFeature.dataSource)
        );
      },
      [navNodeInfoResource],
    );

    function handleClick(event: React.MouseEvent<HTMLDivElement>) {
      if (EventContext.has(event, EventTreeNodeExpandFlag, EventTreeNodeSelectFlag, EventTreeNodeClickFlag, EventStopPropagationFlag)) {
        return;
      }

      tree.resetSelection();
    }

    return (
      <>
        <ElementsTreeTools tree={tree} settingsElements={settingsElements} />
        <DNDScrollContainer ref={treeMergedRef} className={s(styles, { treeBox: true })} isDragging={!!dndBox.state.context}>
          <ElementsTreeContext.Provider value={context}>
            <div
              role="tree"
              aria-label={navNodeInfoResource.get(root)?.name ?? translate('plugin_navigation_tree_explorer_tab_title')}
              className={s(styles, { box: true }, className)}
              {...treeKeyboardNavigation}
              aria-multiselectable
            >
              <FolderExplorer state={folderExplorer}>
                <div ref={dropOutside.mouse.reference} className={s(styles, { tree: true })} onClick={handleClick}>
                  {settings?.showFolderExplorerPath && (
                    <FolderExplorerPath className={s(styles, { folderExplorerPath: true })} getName={getName} canSkip={canSkip} />
                  )}
                  <div
                    ref={dndBox.setRef}
                    className={s(styles, {
                      dropOutside: true,
                      showDropOutside: dropOutside.showDropOutside,
                      active: !!dropOutside.zoneActive,
                      bottom: dropOutside.bottom,
                    })}
                  >
                    <TreeNodeNested root>
                      <TreeNodeNestedMessage>
                        <Translate token="app_navigationTree_drop_here" />
                      </TreeNodeNestedMessage>
                    </TreeNodeNested>
                  </div>
                  <ElementsTreeContentLoader context={context} emptyPlaceholder={emptyPlaceholder} childrenState={tree}>
                    <div className={s(styles, { treeElements: true })}>
                      <NavigationNodeNested
                        ref={dropOutside.nestedRef}
                        nodeId={root}
                        component={NavigationNodeElement}
                        path={folderExplorer.state.path}
                        root
                      />
                    </div>
                  </ElementsTreeContentLoader>
                </div>
              </FolderExplorer>
            </div>
          </ElementsTreeContext.Provider>
        </DNDScrollContainer>
      </>
    );
  }),
);
