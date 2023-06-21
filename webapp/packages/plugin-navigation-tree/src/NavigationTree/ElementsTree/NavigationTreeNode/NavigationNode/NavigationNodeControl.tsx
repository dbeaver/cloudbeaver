/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext, useDeferredValue } from 'react';
import styled, { css, use } from 'reshadow';

import {
  ConnectionImageWithMask,
  getComputed,
  Loader,
  TREE_NODE_STYLES,
  TreeNodeContext,
  TreeNodeControl,
  TreeNodeExpand,
  TreeNodeIcon,
  TreeNodeName,
  useMouseContextMenu,
  useObjectRef,
  useObservableRef,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { EObjectFeature, type INodeActions, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import { ElementsTreeContext } from '../../ElementsTreeContext';
import type { NavTreeControlComponent, NavTreeControlProps } from '../../NavigationNodeComponent';
import { TreeNodeMenuLoader } from '../TreeNodeMenu/TreeNodeMenuLoader';
import { DATA_ATTRIBUTE_NODE_EDITING } from './DATA_ATTRIBUTE_NODE_EDITING';
import { NavigationNodeEditorLoader } from './NavigationNodeLoaders';

const styles = css`
  TreeNodeControl {
    transition: opacity 0.3s ease;
    opacity: 1;

    &[|outdated] {
      opacity: 0.5;
    }
  }
  TreeNodeControl:hover > portal,
  TreeNodeControl:global([aria-selected='true']) > portal,
  portal:focus-within {
    visibility: visible;
  }
  TreeNodeName {
    height: 100%;
    max-width: 320px;
    overflow: hidden;
    text-overflow: ellipsis;

    &[|editing] {
      padding: 0;
      overflow: visible;
      margin-left: 2px;
    }
  }
  portal {
    position: relative;
    box-sizing: border-box;
    margin-left: auto !important;
    margin-right: 8px !important;
    visibility: hidden;
  }
  name-box {
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;

interface IEditingState {
  saving: boolean;
  editing: boolean;

  resolve: (value: string) => Promise<boolean>;

  startEditing(resolve: (value: string) => Promise<boolean>): void;

  save(name: string): void;
  setSaveStatus(saving: boolean): void;
  finish(): void;
  cancel(): void;
}

export const NavigationNodeControl: NavTreeControlComponent = observer<NavTreeControlProps, HTMLDivElement>(
  forwardRef(function NavigationNodeControl({ node, dndElement, dndPlaceholder }, ref) {
    const mouseContextMenu = useMouseContextMenu();
    const treeNodeContext = useContext(TreeNodeContext);
    const treeContext = useContext(ElementsTreeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const navTreeResource = useService(NavTreeResource);
    const outdated = getComputed(() => navNodeInfoResource.isOutdated(node.id) && !treeNodeContext.loading);
    const error = getComputed(() => !!navNodeInfoResource.getException(node.id) || !!navTreeResource.getException(node.id));
    const connected = getComputed(() => node.objectFeatures.includes(EObjectFeature.dataSourceConnected));
    const selected = treeNodeContext.selected;

    const editingState = useObservableRef<IEditingState>(
      () => ({
        saving: false,
        editing: false,
        resolve: () => Promise.resolve(false),

        startEditing(resolve) {
          this.editing = true;
          this.saving = false;
          this.resolve = resolve;
        },

        async save(name: string) {
          this.setSaveStatus(true);
          try {
            const saved = await this.resolve(name);

            if (saved) {
              this.finish();
            }
          } finally {
            this.setSaveStatus(false);
          }
        },
        setSaveStatus(saving: boolean) {
          this.saving = saving;
        },
        finish() {
          this.editing = false;
          this.saving = false;
          this.resolve = () => Promise.resolve(false);
        },
        cancel() {
          this.finish();
        },
      }),
      {
        saving: observable.ref,
        editing: observable.ref,
        startEditing: action.bound,
        save: action.bound,
        setSaveStatus: action.bound,
        finish: action.bound,
        cancel: action.bound,
      },
      false,
    );

    const nodeActions = useObjectRef<INodeActions>({
      rename: editingState.startEditing,
    });

    let icon = node.icon;

    if (error) {
      icon = '/icons/error_icon_sm.svg';
    }

    function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
      EventContext.set(event, EventStopPropagationFlag);
      treeNodeContext.select();
    }

    function onClickHandler(event: React.MouseEvent<HTMLDivElement>) {
      treeNodeContext.select(event.ctrlKey || event.metaKey);
    }

    function handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
      mouseContextMenu.handleContextMenuOpen(event);
      treeNodeContext.select();
    }

    const expandable = useDeferredValue(getComputed(() => treeContext?.tree.isNodeExpandable(node.id) ?? true));
    const filterActive = useDeferredValue(getComputed(() => treeContext?.tree.filtering));
    const { editing, saving } = editingState;

    const attributes = { [DATA_ATTRIBUTE_NODE_EDITING]: editing };

    return styled(
      TREE_NODE_STYLES,
      styles,
    )(
      <TreeNodeControl
        ref={ref}
        {...attributes}
        onClick={onClickHandler}
        onContextMenu={handleContextMenuOpen}
        {...use({ outdated, editing, dragging: dndElement })}
      >
        {expandable && <TreeNodeExpand filterActive={filterActive} />}
        <TreeNodeIcon {...use({ connected })}>
          <ConnectionImageWithMask icon={icon} connected={connected} maskId="tree-node-icon" />
        </TreeNodeIcon>
        <TreeNodeName title={node.name} {...use({ editing })}>
          <Loader suspense inline fullSize>
            {editing ? (
              <NavigationNodeEditorLoader node={node} disabled={saving} onSave={editingState.save} onClose={editingState.cancel} />
            ) : (
              <name-box>{node.name}</name-box>
            )}
          </Loader>
        </TreeNodeName>
        {!editing && !dndPlaceholder && (
          <portal onClick={handlePortalClick}>
            <TreeNodeMenuLoader mouseContextMenu={mouseContextMenu} node={node} actions={nodeActions} selected={selected} />
          </portal>
        )}
      </TreeNodeControl>,
    );
  }),
);
