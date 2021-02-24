/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ISize } from './BASE_CONTAINERS_STYLES';

interface Props extends ISize {
  className?: string;
}

export const GroupContainer: React.FC<Props> = function GroupContainer({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
