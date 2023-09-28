/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface ITreeNodeState {
  group?: boolean;
  disabled?: boolean;
  loading?: boolean;
  selected?: boolean;
  /** It is true when the node is neither selected nor unselected, used to indicate a mixed or partial selection in a group of sub-options */
  indeterminateSelected?: boolean;
  externalExpanded?: boolean;
  expanded?: boolean;
  showInFilter?: boolean;
  leaf?: boolean;
}
