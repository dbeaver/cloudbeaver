/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useMemo, useCallback } from 'react';
import styled, { css } from 'reshadow';

import { FolderExplorer, FolderExplorerPath, Loader, useFolderExplorer, useMapResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { MetadataMap } from '@cloudbeaver/core-utils';

import type { NavNode } from '../shared/NodesManager/EntityTypes';
import { NavNodeInfoResource, ROOT_NODE_PATH } from '../shared/NodesManager/NavNodeInfoResource';
import { NavTreeResource } from '../shared/NodesManager/NavTreeResource';
import { elementsTreeNameFilter } from './elementsTreeNameFilter';
import type { NavTreeControlComponent } from './NavigationNodeComponent';
import { NavigationNodeNested } from './NavigationTreeNode/NavigationNode/NavigationNodeNested';
import { NavigationNodeElement } from './NavigationTreeNode/NavigationNodeElement';
import { NavigationTreeService } from './NavigationTreeService';
import { ITreeContext, TreeContext } from './TreeContext';
import { IElementsTreeCustomRenderer, IElementsTreeFilter, ITreeNodeState, useElementsTree } from './useElementsTree';

const styles = css`
  tree {
    position: relative;
    box-sizing: border-box;
  }

  center {
    display: flex;
    height: 100%;
    width: 100%;
    min-width: 240px;
  }

  FolderExplorerPath {
    padding: 0 12px 8px 12px;
  }
`;

interface Props {
  root?: string;
  keepData?: boolean;
  disabled?: boolean;
  selectionTree?: boolean;
  foldersTree?: boolean;
  showFolderExplorerPath?: boolean;
  localState?: MetadataMap<string, ITreeNodeState>;
  control?: NavTreeControlComponent;
  emptyPlaceholder?: React.FC;
  className?: string;
  filters?: IElementsTreeFilter[];
  renderers?: IElementsTreeCustomRenderer[];
  customSelect?: (node: NavNode, multiple: boolean, nested: boolean) => void;
  beforeSelect?: (node: NavNode, multiple: boolean, nested: boolean) => void;
  isGroup?: (node: NavNode) => boolean;
  onExpand?: (node: NavNode, state: boolean) => Promise<void> | void;
  onClick?: (node: NavNode) => Promise<void> | void;
  onOpen?: (node: NavNode) => Promise<void> | void;
  onSelect?: (node: NavNode, state: boolean) => void;
  onFilter?: (node: NavNode, value: string) => void;
}

export const ElementsTree = observer<Props>(function ElementsTree({
  root: baseRoot = ROOT_NODE_PATH,
  control,
  keepData = false,
  disabled,
  showFolderExplorerPath,
  localState,
  selectionTree = false,
  foldersTree = false,
  emptyPlaceholder,
  filters,
  renderers,
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
  const folderExplorer = useFolderExplorer(baseRoot);
  const root = folderExplorer.folder;
  const Placeholder = emptyPlaceholder;
  const navNodeInfoResource = useService(NavNodeInfoResource);
  const navigationTreeService = useService(NavigationTreeService);

  const children = useMapResource(ElementsTree, NavTreeResource, root, {
    isActive: () => navigationTreeService.loadNestedNodes(root, true),
  });

  const nameFilter = useMemo(() => elementsTreeNameFilter(navNodeInfoResource), [navNodeInfoResource]);

  const tree = useElementsTree({
    baseRoot,
    root,
    disabled,
    keepData,
    localState,
    filters: [nameFilter, ...(filters || [])],
    renderers,
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
      onClick: async (node, leaf) => {
        await onClick?.(node);

        if (!leaf && foldersTree) {
          await navigationTreeService.loadNestedNodes(root, true);
          folderExplorer.open(node.id);
        }
      },
    }),
    [control, selectionTree, onOpen, onClick, folderExplorer, foldersTree]
  );

  const getName = useCallback(
    (folder: string) => navNodeInfoResource.get(folder)?.name || folder,
    [navNodeInfoResource]
  );

  const hasChildren = (children.data?.length || 0) > 0;
  let loading = children.isLoading() || tree.loading;

  if (foldersTree && folderExplorer.root !== root) {
    loading = false;
  }

  if (keepData && loading) {
    return styled(styles)(
      <center>
        <Loader />
      </center>
    );
  }

  if (!hasChildren) {
    if (loading) {
      return styled(styles)(
        <center>
          <Loader />
        </center>
      );
    } else if (folderExplorer.root === folderExplorer.folder) {
      return <>{Placeholder && <Placeholder />}</>;
    }
  }

  return styled(styles)(
    <TreeContext.Provider value={context}>
      <FolderExplorer state={folderExplorer}>
        <tree className={className}>
          {showFolderExplorerPath && <FolderExplorerPath getName={getName} />}
          <NavigationNodeNested nodeId={root} component={NavigationNodeElement} root />
          <Loader loading={loading} overlay={hasChildren} />
        </tree>
      </FolderExplorer>
    </TreeContext.Provider>
  );
});
