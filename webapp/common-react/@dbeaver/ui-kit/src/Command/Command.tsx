/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Command as AriakitCommand, type CommandProps as AriakitCommandProps } from '@ariakit/react';

export interface CommandProps extends AriakitCommandProps {}

export function Command({ ...props }: CommandProps): React.ReactElement {
  return <AriakitCommand {...props} />;
}
