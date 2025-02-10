/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Button } from '../index.js';

export const Primary = () => <Button>Primary</Button>;
export const Secondary = () => <Button variant="secondary">Secondary</Button>;
export const Loading = () => <Button loading>Loading</Button>;
export const Disabled = () => <Button disabled>Disabled</Button>;
export const SecondaryLoading = () => (
  <Button variant="secondary" loading>
    Loading
  </Button>
);
