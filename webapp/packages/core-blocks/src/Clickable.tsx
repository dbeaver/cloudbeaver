/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Command, type CommandProps } from '@dbeaver/ui-kit';

export interface ClickableProps extends CommandProps {}

export function Clickable(props: ClickableProps): React.ReactElement {
  return <Command {...props} />;
}
