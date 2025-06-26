/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Compartment, Extension, SelectionRange } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';

/** Currently we support only main selection range */
export interface ISelection {
  anchor: number;
  head?: number;
}

export interface IReactCodeMirrorProps extends React.PropsWithChildren {
  /** in case of using editor in editing mode its better for performance to use getValue instead */
  value?: string;
  cursor?: ISelection;
  incomingValue?: string;
  getValue?: () => string;
  extensions?: Map<Compartment, Extension>;
  readonly?: boolean;
  copyEventHandler?: (event: ClipboardEvent) => boolean;
  autoFocus?: boolean;
  onChange?: (value: string, selection: SelectionRange, update: ViewUpdate) => void;
  onCursorChange?: (selection: SelectionRange, update: ViewUpdate) => void;
  onUpdate?: (update: ViewUpdate) => void;
}
