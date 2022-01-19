/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Props extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const TreeNodeName: React.FC<Props> = function TreeNodeName({
  className,
  children,
  ...rest
}) {
  return <div className={className} {...rest}>{children}</div>;
};
