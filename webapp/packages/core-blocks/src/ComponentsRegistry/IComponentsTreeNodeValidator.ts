/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export interface IComponentsTreeNodeValidator<T extends React.FC<any>> {
  component: T;
  replacement?: T;
  validator: (props: T extends React.FC<infer P> ? P : unknown) => boolean;
}
