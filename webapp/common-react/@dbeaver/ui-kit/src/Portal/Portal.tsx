/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Portal as AriakitPortal, type PortalProps } from '@ariakit/react';

export function Portal({ children, ...props }: PortalProps) {
    return <AriakitPortal {...props}>{children}</AriakitPortal>;
}

export type { PortalProps };