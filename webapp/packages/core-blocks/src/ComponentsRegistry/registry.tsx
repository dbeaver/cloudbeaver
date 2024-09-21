/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { forwardRef, useContext } from 'react';

import { ComponentsRegistryContext } from './ComponentsRegistryContext.js';
import { ComponentsTreeContext } from './ComponentsTreeContext.js';
import { type IComponentsTreeNode } from './IComponentsTreeNode.js';
import { type IComponentsTreeNodeValidator } from './IComponentsTreeNodeValidator.js';

/**
 * experimental, can be changed
 */
export function registry<T extends React.FC<any>>(component: T): T {
  const componentRef = observer<any, any>(
    forwardRef(function Registry(props, ref) {
      const node: IComponentsTreeNode<any> = {
        component: componentRef,
        props,
        replacement: null,
      };
      const context = [...useContext(ComponentsTreeContext), node];
      const registry = useContext(ComponentsRegistryContext);
      let Component = component as any;

      const registryNodes = registry.get(componentRef);
      for (const validators of registryNodes || []) {
        if (validators) {
          const result = getComponent(context, validators);

          if (result) {
            Component = result;
            break;
          }
        }
      }

      if (Component !== component) {
        node.replacement = Component;
      }

      return (
        <ComponentsTreeContext.Provider value={context}>
          <Component ref={ref} {...props} />
        </ComponentsTreeContext.Provider>
      );
    }),
  );

  return componentRef as unknown as T;
}

function getComponent(context: IComponentsTreeNode<any>[], validators: IComponentsTreeNodeValidator<any>[]) {
  let position = 0;
  let node = context[position]!;
  let lastValidator: IComponentsTreeNodeValidator<any> | null = null;

  for (const validator of validators) {
    lastValidator = validator;
    while (position < context.length) {
      node = context[position++]!;
      if (node.component === lastValidator.component) {
        if (!lastValidator.validator(node.props) || (node.replacement !== null && node.replacement === lastValidator.replacement)) {
          return null;
        }
        break;
      }
    }

    if (position >= context.length) {
      break;
    }
  }

  if (node.component === lastValidator?.component && lastValidator.replacement) {
    return lastValidator.replacement;
  }

  return null;
}
