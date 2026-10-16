/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { NavNode, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import type { ProjectInfoResource } from '@cloudbeaver/core-projects';

export interface INodeDeletionTarget {
  node: NavNode;
  /** Deleting configuration preserves descendants rather than deleting their contents. */
  keepChildren?: boolean;
  /** Localization token describing the operation, rather than the tree renderer. */
  type: string;
  /** Shows the readonly indicator; deletion availability is checked separately. */
  readOnly?: boolean;
  /** Localization token explaining why this node cannot be deleted. */
  reason?: string;
  /** Localization token for a warning shown while this node is selected. */
  warning?: string;
  /** Technical root node omitted from the displayed location. */
  locationRoot?: string;
}

export interface INodeDeletionOperation {
  id: string;
  owner: string;
  targets: INodeDeletionTarget[];
  /** Only execute the ready, confirmed subset. Preparation must not mutate resources or open dialogs. */
  execute: (targetIds: string[]) => Promise<INodeDeletionOutcome[]>;
}

export interface INodeDeletionOutcome {
  targetId: string;
  status: 'deleted' | 'failed' | 'unknown' | 'cancelled';
  error?: unknown;
}

export interface INodeDeletionPlanBuilder {
  readonly operations: readonly INodeDeletionOperation[];
  readonly exclusions: readonly INodeDeletionExcludedTarget[];
  addOperation(operation: INodeDeletionOperation): void;
  exclude(target: INodeDeletionExcludedTarget): void;
  validateOwnership(): void;
  prepare(navNodeInfoResource: NavNodeInfoResource, projectInfoResource: ProjectInfoResource): Promise<INodeDeletionPlan>;
}

export interface INodeDeletionPlan {
  items: INodeDeletionItem[];
  rows: INodeDeletionDialogItem[];
}

export interface INodeDeletionExcludedTarget extends Partial<Omit<INodeDeletionTarget, 'node'>> {
  owner: string;
  node: NavNode;
  reason: string;
}

export interface INodeDeletionDialogItem {
  id: string;
  name: string;
  icon?: string;
  type: string;
  readOnly?: boolean;
  project: string;
  location: string;
  warning?: string;
  reason?: string;
}

export interface INodeDeletionItem extends INodeDeletionTarget {
  /** Explicitly selected node to delete. */
  node: NavNode;
  /** All parent URIs, from the tree root to the immediate parent. */
  parents: string[];
  operation: INodeDeletionOperation;
}

export interface INodeDeletionExclusion {
  /** Selected node excluded from execution. */
  node: NavNode;
  /** All parent URIs, used to protect this node from deletion through a parent. */
  parents: string[];
  /** Localization token explaining the exclusion in confirmation. */
  reason: string;
}

export interface INodeDeletionResult {
  /** Planned deletion described by this result. */
  item: INodeDeletionItem;
  /**
   * Deleted confirms success; failed means a single-node error; unknown means a batch may have partially completed.
   * Cancelled means a lifecycle guard stopped deletion; skipped means dependencies blocked it.
   */
  status: 'deleted' | 'failed' | 'unknown' | 'cancelled' | 'skipped';
  /** Error returned or thrown by the operation. */
  error?: unknown;
  /** Shared identity for reporting a partially completed batch once, without guessing individual outcomes. */
  batch?: readonly INodeDeletionItem[];
}
