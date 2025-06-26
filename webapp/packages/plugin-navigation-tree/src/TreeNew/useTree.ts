/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import { useObservableRef } from '@cloudbeaver/core-blocks';

import type { INodeRenderer, NodeComponent } from './INodeRenderer.js';
import type { ITreeData } from './ITreeData.js';

interface IOptions {
  data: ITreeData;
  nodeRenderers?: INodeRenderer[];
  onNodeClick?(id: string): void | Promise<void>;
  onNodeDoubleClick?(id: string): void | Promise<void>;
  getNodeHeight(id: string): number;
}

export interface ITree {
  getNodeComponent(id: string): NodeComponent | null;
  getNodeHeight(id: string): number;

  openNode(id: string): Promise<void>;
  clickNode(id: string): Promise<void>;
  expandNode(id: string, state: boolean): Promise<void>;
  selectNode(id: string, selected?: boolean): void;
}

export function useTree(options: IOptions): ITree {
  options = useObservableRef(options, {
    data: observable.ref,
    nodeRenderers: observable.ref,
    onNodeClick: observable.ref,
    onNodeDoubleClick: observable.ref,
    getNodeHeight: observable.ref,
  });

  const data = useObservableRef(
    () => ({
      getNodeComponent(id: string): NodeComponent | null {
        if (!options.nodeRenderers) {
          return null;
        }

        for (const renderer of options.nodeRenderers) {
          const component = renderer(id);

          if (component) {
            return component;
          }
        }

        return null;
      },
      getNodeHeight(id: string): number {
        return options.getNodeHeight(id);
      },
      async clickNode(id: string) {
        await options.onNodeClick?.(id);
      },
      async openNode(id: string) {
        await options.onNodeDoubleClick?.(id);
      },
      async expandNode(id: string, state: boolean) {
        try {
          options.data.updateState(id, { expanded: state });
          if (state) {
            await options.data.load(id, true);
          }
        } catch (exception) {
          options.data.updateState(id, { expanded: false });
        }
      },
      selectNode(id: string, selected = true) {
        options.data.updateState(id, { selected });
      },
    }),
    {},
    {},
  );

  return data;
}
