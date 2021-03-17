/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = function Link({
  className,
  children,
  ...rest
}) {
  return (
    <div className={className}>
      <a {...rest}>{children}</a>
    </div>
  );
};
