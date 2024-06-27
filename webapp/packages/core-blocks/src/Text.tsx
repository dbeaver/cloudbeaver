/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

export const Text: React.FC<React.HTMLAttributes<HTMLDivElement>> = observer(function Text({ children, ...rest }) {
  return <div {...rest}>{children}</div>;
});
