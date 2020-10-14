/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

interface Props {
  className?: string;
}

export const AdministrationTools: React.FC<Props> = function AdministrationTools({ children, className }) {
  return (
    <administration-tools as='div' className={className}>
      {children}
    </administration-tools>
  );
};
