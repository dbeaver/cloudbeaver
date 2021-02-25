/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Props {
  open?: boolean;
  className?: string;
}

export const SlideBox: React.FC<Props> = function SlideBox({ children, className }) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};
