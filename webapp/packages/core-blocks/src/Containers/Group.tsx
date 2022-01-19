/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { forwardRef } from 'react';

import { filterContainerFakeProps } from './filterContainerFakeProps';
import type { IContainerProps } from './IContainerProps';

interface Props extends IContainerProps {
  form?: boolean;
  center?: boolean;
  box?: boolean;
}

export const Group = forwardRef<HTMLDivElement, Props & React.HTMLAttributes<HTMLDivElement>>(function Group({
  form,
  center,
  box,
  ...rest
}, ref) {
  const divProps = filterContainerFakeProps(rest);

  return <div ref={ref} {...divProps} />;
});
