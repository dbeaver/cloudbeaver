/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IGridItemsLayoutProps, ILayoutSizeProps } from './ILayoutContainerProps';
interface Props extends ILayoutSizeProps, IGridItemsLayoutProps {
  className?: string;
  horizontal?: boolean;
  wrap?: boolean;
  overflow?: boolean;
  parent?: boolean;
  limitWidth?: boolean;
  gap?: boolean;
}

export const ColoredContainer: React.FC<Props> = function ColoredContainer({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
