/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IContainerProps } from './IContainerProps';

export const Container: React.FC<IContainerProps> = function Container({ children, ...rest }) {
  return (
    <div {...rest}>
      {children}
    </div>
  );
};
