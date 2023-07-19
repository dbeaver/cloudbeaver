/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { Compartment, Extension } from '@codemirror/state';
import type { ViewUpdate } from '@codemirror/view';

export interface IReactCodeMirrorProps extends React.PropsWithChildren {
  /** in case of using editor in editing mode its better for performance to use getValue instead */
  value?: string;
  incomingValue?: string;
  getValue?: () => string;
  extensions?: Map<Compartment, Extension>;
  readonly?: boolean;
  autoFocus?: boolean;
  onChange?: (value: string, update: ViewUpdate) => void;
  onUpdate?: (update: ViewUpdate) => void;
}
