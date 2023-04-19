/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IReactCodeMirrorProps } from './IReactCodemirrorProps';
import type { LangMode } from './LANG_EXT';

export interface IEditorProps extends IReactCodeMirrorProps {
  className?: string;
  mode?: LangMode;
  autoFormat?: boolean;
}