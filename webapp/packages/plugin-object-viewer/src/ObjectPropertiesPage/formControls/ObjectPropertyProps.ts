/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { PropsWithChildren } from 'react';

import type { IGridItemsLayoutProps, ILayoutSizeProps } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

export type ObjectPropertyProps = PropsWithChildren<{
  objectProperty?: ObjectPropertyInfo;
  className?: string;
}> & ILayoutSizeProps & IGridItemsLayoutProps;
