/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Focusable as UiKitFocusable, type FocusableProps } from '@dbeaver/ui-kit';

export type ClickableProps = FocusableProps;

export function Focusable(props: ClickableProps): React.ReactElement {
  return <UiKitFocusable {...props} />;
}
