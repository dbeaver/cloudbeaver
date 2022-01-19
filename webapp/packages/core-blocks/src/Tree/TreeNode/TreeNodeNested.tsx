/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Props {
  expanded?: boolean;
  root?: boolean;
  className?: string;
}

export const TreeNodeNested: React.FC<Props> = function TreeNodeNested({
  className,
  children,
}) {
  return <div className={className}>{children}</div>;
};
