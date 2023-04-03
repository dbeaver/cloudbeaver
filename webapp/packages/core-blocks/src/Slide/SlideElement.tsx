/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Props {
  className?: string;
}

export const SlideElement: React.FC<React.PropsWithChildren<Props>> = function SlideElement({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
