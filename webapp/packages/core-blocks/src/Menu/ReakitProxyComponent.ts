/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { As, PropsWithAs } from 'reakit-utils/types';

export type ReakitProxyPropsWithAs<O, T extends As> = PropsWithAs<O, T>;

export type ReakitProxyComponentOptions<T extends As, O> = ReakitProxyPropsWithAs<O, T>;

export type ReakitProxyComponent<T extends As, O> = {
  <TT extends As = T>(
    props: ReakitProxyPropsWithAs<O, TT> & {
      as: TT;
    },
    context?: any,
  ): React.ReactElement<any, any> | null;
  (props: ReakitProxyPropsWithAs<O, T>, context?: any): React.ReactElement<any, any> | null;
};
