/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface INodeComponentBaseProps {
  nodeId: string;
  offsetHeight: number;
}

export interface INodeControlBaseProps extends React.RefAttributes<HTMLDivElement> {
  nodeId: string;
}

export type NodeControlComponent =
  | React.MemoExoticComponent<React.ForwardRefExoticComponent<React.PropsWithoutRef<INodeControlBaseProps> & React.RefAttributes<HTMLDivElement>>>
  | React.ForwardRefExoticComponent<React.PropsWithoutRef<INodeControlBaseProps> & React.RefAttributes<HTMLDivElement>>;

export interface INodeComponentProps extends INodeComponentBaseProps {
  childrenRenderer: React.FC<INodeComponentBaseProps>;
  controlRenderer?: NodeControlComponent;
}

export type NodeComponent = React.FC<INodeComponentProps>;

export type INodeRenderer = (nodeId: string) => NodeComponent | null;
