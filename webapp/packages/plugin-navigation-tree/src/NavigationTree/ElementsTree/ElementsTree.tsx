/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';

import {
  EventTreeNodeClickFlag,
  EventTreeNodeExpandFlag,
  EventTreeNodeSelectFlag,
  FolderExplorer,
  FolderExplorerPath,
  PlaceholderElement,
  s,
  Translate,
  TreeNodeNested,
  TreeNodeNestedMessage,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { EObjectFeature, type NavNode, NavNodeInfoResource, NavTreeResource, ROOT_NODE_PATH } from '@cloudbeaver/core-navigation-tree';
import type { ComponentStyle } from '@cloudbeaver/core-theming';

import { useNavTreeDropBox } from '../useNavTreeDropBox';
import styles from './ElementsTree.m.css';
import { ElementsTreeContentLoader } from './ElementsTreeContentLoader';
import { ElementsTreeContext, IElementsTreeContext } from './ElementsTreeContext';
import { elementsTreeNameFilter } from './elementsTreeNameFilter';
import { ElementsTreeTools } from './ElementsTreeTools/ElementsTreeTools';
import type { IElementsTreeSettingsProps } from './ElementsTreeTools/NavigationTreeSettings/ElementsTreeSettingsService';
import type { NavTreeControlComponent } from './NavigationNodeComponent';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import type { NavNodeFilterCompareFn } from './NavNodeFilterCompareFn';
import { elementsTreeLimitFilter } from './NavTreeLimitFilter/elementsTreeLimitFilter';
import { elementsTreeLimitRenderer } from './NavTreeLimitFilter/elementsTreeLimitRenderer';
import { useDropOutside } from './useDropOutside';
import { IElementsTreeOptions, useElementsTree } from './useElementsTree';
import { useElementsTreeFolderExplorer } from './useElementsTreeFolderExplorer';

export interface ElementsTreeProps extends IElementsTreeOptions, React.PropsWithChildren {
  root?: string;
  selectionTree?: boolean;
  control?: NavTreeControlComponent;
  emptyPlaceholder?: React.FC;
  style?: ComponentStyle;
  className?: string;
  settingsElements?: PlaceholderElement<IElementsTreeSettingsProps>[];
  navNodeFilterCompare?: NavNodeFilterCompareFn;
  onClick?: (node: NavNode) => Promise<void> | void;
  onOpen?: (node: NavNode, folder: boolean) => Promise<void> | void;
}

export const ElementsTree = observer<ElementsTreeProps>(function ElementsTree({
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
  const computedStyles = useS(styles, style);
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
      <ElementsTreeTools tree={tree} settingsElements={settingsElements} style={style} />
      <div ref={setTreeRootRef} className={s(computedStyles, { treeBox: true })}>
        <ElementsTreeContext.Provider value={context}>
          <div className={s(computedStyles, { box: true }, className)}>
            <FolderExplorer state={folderExplorer}>
              <div ref={dropOutside.mouse.reference} className={s(computedStyles, { tree: true })} onClick={handleClick}>
                {settings?.showFolderExplorerPath && (
                  <FolderExplorerPath className={s(computedStyles, { folderExplorerPath: true })} getName={getName} canSkip={canSkip} />
                )}
                <div
                  ref={dndBox.setRef}
                  className={s(computedStyles, {
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
                  <div className={s(computedStyles, { treeElements: true })}>
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
      </div>
    </>
  );
});
