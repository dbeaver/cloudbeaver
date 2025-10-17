/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Clickable as ReakitClickable } from 'reakit';
export type { Component as ReakitComponent } from 'reakit-system';

export const Clickable: typeof ReakitClickable = function Clickable(props: any) {
  const Component = ReakitClickable;

  return <Component {...props} />;
} as typeof ReakitClickable;
