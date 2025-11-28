/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Focusable as ReakitFocusable, type FocusableProps as ReakitFocusableProps } from '@ariakit/react';

export function Focusable(props: ReakitFocusableProps): React.ReactElement {
  return <ReakitFocusable {...props} />;
}

export type FocusableProps = ReakitFocusableProps;
