/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { filterLayoutFakeProps } from './filterLayoutFakeProps';
import type { ILayoutSizeProps } from './ILayoutSizeProps';

export const GroupTitle: React.FC<ILayoutSizeProps & React.HTMLAttributes<HTMLHeadingElement>> = function GroupTitle(props) {
  const divProps = filterLayoutFakeProps(props);
  return <h2 {...divProps} />;
};
