/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { filterLayoutFakeProps } from './filterLayoutFakeProps';
import type { ILayoutSizeProps } from './ILayoutSizeProps';

export const GroupItem: React.FC<ILayoutSizeProps & React.HTMLAttributes<HTMLDivElement>> = function GroupItem(props) {
  const divProps = filterLayoutFakeProps(props);
  return <div {...divProps} />;
};
