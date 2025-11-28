/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Focusable as UiKitFocusable, type FocusableProps as UiKitFocusableProps } from '@dbeaver/ui-kit';

export type FocusableProps = UiKitFocusableProps;

export function Focusable(props: FocusableProps): React.ReactElement {
  return <UiKitFocusable {...props} />;
}
