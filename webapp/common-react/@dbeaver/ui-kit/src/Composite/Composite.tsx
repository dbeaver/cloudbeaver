/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
    Composite as AriakitComposite,
    CompositeItem as AriakitCompositeItem,
    CompositeProvider as AriakitCompositeProvider,
    useCompositeStore,
    type CompositeProps,
    type CompositeItemProps,
    type CompositeProviderProps,
    type CompositeStore,
} from '@ariakit/react';

export function CompositeProvider({ children, ...props }: CompositeProviderProps) {
    return <AriakitCompositeProvider {...props}>{children}</AriakitCompositeProvider>;
}

export function Composite({ children, ...props }: CompositeProps) {
    return <AriakitComposite {...props}>{children}</AriakitComposite>;
}

export function CompositeItem({ children, ...props }: CompositeItemProps) {
    return <AriakitCompositeItem {...props}>{children}</AriakitCompositeItem>;
}

export { useCompositeStore, type CompositeProps, type CompositeItemProps, type CompositeProviderProps, type CompositeStore };