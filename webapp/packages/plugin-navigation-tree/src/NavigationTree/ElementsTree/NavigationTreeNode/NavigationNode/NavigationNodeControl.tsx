/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';

import {
  getComputed,
  Loader,
  s,
  TreeNodeContext,
  TreeNodeControl,
  TreeNodeIcon,
  TreeNodeName,
  useMouseContextMenu,
  useObjectRef,
  useObservableRef,
  useS,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { EventContext, EventStopPropagationFlag } from '@cloudbeaver/core-events';
import { getNodePlainName, type INodeActions, NavNodeInfoResource, NavTreeResource } from '@cloudbeaver/core-navigation-tree';

import style from '../../../NavigationNodeControl.m.css';
import type { NavTreeControlComponent, NavTreeControlProps } from '../../NavigationNodeComponent';
import { TreeNodeMenuLoader } from '../TreeNodeMenu/TreeNodeMenuLoader';
import { DATA_ATTRIBUTE_NODE_EDITING } from './DATA_ATTRIBUTE_NODE_EDITING';
import { NavigationNodeExpand } from './NavigationNodeExpand';
import { NavigationNodeEditorLoader } from './NavigationNodeLoaders';

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
  forwardRef(function NavigationNodeControl({ node, nodeInfo, dndElement, dndPlaceholder, className, onClick }, ref) {
    const styles = useS(style);
    const mouseContextMenu = useMouseContextMenu();
    const treeNodeContext = useContext(TreeNodeContext);
    const navNodeInfoResource = useService(NavNodeInfoResource);
    const navTreeResource = useService(NavTreeResource);
    const error = getComputed(() => !!navNodeInfoResource.getException(node.id) || !!navTreeResource.getException(node.id));
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

    let icon = nodeInfo.icon;
    const name = nodeInfo.name;
    const title = nodeInfo.tooltip;

    if (error) {
      icon = '/icons/error_icon_sm.svg';
    }

    function handlePortalClick(event: React.MouseEvent<HTMLDivElement>) {
      EventContext.set(event, EventStopPropagationFlag);
      treeNodeContext.select();
    }

    function handleContextMenuOpen(event: React.MouseEvent<HTMLDivElement>) {
      mouseContextMenu.handleContextMenuOpen(event);
      treeNodeContext.select();
    }

    const { editing, saving } = editingState;

    const attributes = { [DATA_ATTRIBUTE_NODE_EDITING]: editing };

    return (
      <TreeNodeControl
        ref={ref}
        {...attributes}
        className={s(styles, { treeNodeControl: true }, className)}
        editing={editing}
        onClick={onClick}
        onContextMenu={handleContextMenuOpen}
      >
        <NavigationNodeExpand nodeId={node.id} />
        <TreeNodeIcon icon={icon} />
        <TreeNodeName title={title} className={s(styles, { treeNodeName: true, editing })}>
          <Loader suspense inline fullSize>
            {editing ? (
              <NavigationNodeEditorLoader name={getNodePlainName(node)} disabled={saving} onSave={editingState.save} onClose={editingState.cancel} />
            ) : (
              <div className={s(styles, { nameBox: true })}>{name}</div>
            )}
          </Loader>
        </TreeNodeName>
        {!editing && !dndPlaceholder && (
          <div className={s(styles, { portal: true })} onClick={handlePortalClick}>
            <TreeNodeMenuLoader mouseContextMenu={mouseContextMenu} node={node} actions={nodeActions} selected={selected} />
          </div>
        )}
      </TreeNodeControl>
    );
  }),
);
