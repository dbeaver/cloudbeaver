/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ClickableOptions, Clickable as MantineClickable } from 'reakit';

import type { ReakitProxyComponent, ReakitProxyComponentOptions } from './Menu/ReakitProxyComponent.js';

export const Clickable: ReakitProxyComponent<'button', ClickableOptions> = observer<ReakitProxyComponentOptions<'button', ClickableOptions>>(
  function Clickable({ children, ...rest }) {
    const Component = MantineClickable;

    return <Component {...rest}>{children}</Component>;
  },
) as ReakitProxyComponent<'button', ClickableOptions>;
