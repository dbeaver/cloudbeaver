/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { act, forwardRef } from 'react';
import { runInAction } from 'mobx';
import { createPortal } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DialogsPortal, TreeNodeContext, TreeNodeControl, type ITreeNodeContext } from '@cloudbeaver/core-blocks';
import * as DI from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { EventContext, EventStopPropagationFlag, NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { NavNodeInfoResource, NavTreeResource, type NavNode } from '@cloudbeaver/core-navigation-tree';

import { NodeDeletionDialog } from '../../../NodesManager/NodeDeletion/NodeDeletionDialog.js';
import { NavigationTreeService } from '../../NavigationTreeService.js';
import { ElementsTreeContext, type IElementsTreeContext } from '../ElementsTreeContext.js';
import type { NavTreeControlProps } from '../NavigationNodeComponent.js';
import { NavigationNodeControlRenderer } from './NavigationNodeControlRenderer.js';
import { useNavigationNode, type INavigationNode } from './useNavigationNode.js';

describe('navigation node context-menu selection', () => {
  let root: Root;
  let container: HTMLDivElement;
  let dialogs: CommonDialogService;
  let selected: Set<string>;
  let select: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.stubGlobal('IS_REACT_ACT_ENVIRONMENT', true);
    vi.stubGlobal('_ROOT_URI_', '/');
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(private readonly callback: IntersectionObserverCallback) {}
        observe(target: Element) {
          this.callback([{ target, isIntersecting: true } as IntersectionObserverEntry], this as unknown as IntersectionObserver);
        }
        unobserve() {}
        disconnect() {}
      },
    );
    dialogs = new CommonDialogService();
    selected = new Set(['a', 'b']);
    select = vi.fn((multiple: boolean) => {
      if (!multiple) {
        selected.clear();
      }
      selected.add('a');
      return Promise.resolve();
    });
    vi.spyOn(DI, 'useService').mockImplementation(token => {
      if (token === NavNodeInfoResource) {
        return { isOutdated: () => false } as unknown as NavNodeInfoResource;
      }
      if (token === CommonDialogService) {
        return dialogs;
      }
      if (token === LocalizationService) {
        return { translate: (token: string) => token } as LocalizationService;
      }
      if (token === NotificationService) {
        return {} as NotificationService;
      }
      throw new Error('Service not available in this selection test');
    });
    container = document.createElement('div');
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  async function renderNode() {
    const node: NavNode = {
      uri: 'a',
      name: 'A',
      hasChildren: false,
      folder: false,
      inline: false,
      navigable: true,
      filtered: false,
      objectFeatures: [],
    };
    const Control = forwardRef<HTMLDivElement, NavTreeControlProps>(function Control({ onClick }, ref) {
      return (
        <TreeNodeControl ref={ref} data-testid="node-control" onClick={onClick}>
          <span onClick={event => EventContext.set(event, EventStopPropagationFlag)}>
            {createPortal(
              <button
                type="button"
                onClick={() =>
                  dialogs.open(NodeDeletionDialog, {
                    items: [{ id: 'a', name: 'A', type: 'connection', project: 'Project', location: 'Project' }],
                  })
                }
              >
                Delete
              </button>,
              document.body,
            )}
          </span>
        </TreeNodeControl>
      );
    });
    const context = {
      getTreeRoot: () => container,
      tree: { getTransformedNodeInfo: () => ({ name: 'A' }) },
    } as unknown as IElementsTreeContext;
    await act(() =>
      root.render(
        <>
          <TreeNodeContext.Provider value={{ selected: true, loading: false, select } as unknown as ITreeNodeContext}>
            <ElementsTreeContext.Provider value={context}>
              <NavigationNodeControlRenderer node={node} navNode={{ control: Control } as unknown as INavigationNode} />
            </ElementsTreeContext.Provider>
          </TreeNodeContext.Provider>
          <DialogsPortal />
        </>,
      ),
    );
  }

  it.each(['cancel', 'close', 'escape'])('keeps the selection after dismissing confirmation with %s', async method => {
    await renderNode();
    const open = [...document.querySelectorAll('button')].find(button => button.textContent === 'Delete')!;
    await act(async () => {
      runInAction(() => open.click());
      await Promise.resolve();
    });
    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    await act(async () => {
      runInAction(() => {
        if (method === 'escape') {
          dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        } else if (method === 'close') {
          dialog.querySelector<HTMLButtonElement>('[aria-label="Close"]')!.click();
        } else {
          [...dialog.querySelectorAll('button')].find(button => button.textContent === 'ui_processing_cancel')!.click();
        }
      });
      await Promise.resolve();
    });
    expect(dialogs.dialogs).toHaveLength(0);
    expect([...selected]).toEqual(['a', 'b']);
    expect(select).not.toHaveBeenCalled();
  });

  it('keeps selection when the same node receives a new metadata object and clears it on unmount', async () => {
    vi.spyOn(DI, 'useService').mockImplementation(token => {
      if (token === NavNodeInfoResource || token === NavTreeResource) {
        return {
          get: () => undefined,
          getException: () => null,
          isLoading: () => false,
          isLoaded: () => true,
          isOutdated: () => false,
        } as unknown as NavNodeInfoResource;
      }
      if (token === NavigationTreeService) {
        return { getChildren: () => [] } as unknown as NavigationTreeService;
      }
      throw new Error('Unexpected service in node selection test');
    });
    const node: NavNode = {
      uri: 'a',
      name: 'A',
      hasChildren: false,
      folder: false,
      inline: false,
      navigable: true,
      filtered: false,
      objectFeatures: [],
    };
    const selectNode = vi.fn((node: NavNode) => {
      selected.delete(node.uri);
    });
    const context = {
      tree: {
        getNodeState: () => ({}),
        isNodeExpanded: () => false,
        isNodeLeaf: () => true,
        isNodeSelected: (uri: string) => selected.has(uri),
        isNodeIndeterminateSelected: () => false,
        select: selectNode,
      },
    } as unknown as IElementsTreeContext;
    function Probe({ node }: { node: NavNode }) {
      useNavigationNode(node, []);
      return null;
    }
    const render = (node: NavNode) =>
      root.render(
        <ElementsTreeContext value={context}>
          <Probe node={node} />
        </ElementsTreeContext>,
      );

    await act(() => render(node));
    await act(() => render({ ...node, name: 'Updated A' }));

    expect([...selected]).toEqual(['a', 'b']);
    expect(selectNode).not.toHaveBeenCalled();
    await act(() => root.render(null));
    expect([...selected]).toEqual(['b']);
    expect(selectNode).toHaveBeenCalledExactlyOnceWith(node, true, false);
  });

  it('still applies single selection for an ordinary node click', async () => {
    await renderNode();
    await act(() => container.querySelector<HTMLElement>('[data-testid="node-control"]')!.click());
    expect([...selected]).toEqual(['a']);
    expect(select).toHaveBeenCalledExactlyOnceWith(false);
  });
});
