/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

/**
 * Based on https://github.com/akameco/babel-plugin-react-data-testid
 */

import type { PluginObj, NodePath, Visitor } from '@babel/core';
import syntaxJsx from '@babel/plugin-syntax-jsx';
import * as t from '@babel/types';

type FunctionType =
  | t.FunctionDeclaration
  | t.FunctionExpression
  | t.ArrowFunctionExpression;

function nameForReactComponent(
  path: NodePath<FunctionType>
): t.Identifier | null {
  const { parentPath } = path;
  if (!t.isArrowFunctionExpression(path.node) && t.isIdentifier(path.node.id)) {
    return path.node.id;
  }
  if (t.isVariableDeclarator(parentPath)) {
    // @ts-expect-error expected
    return parentPath.node.id;
  }
  return null;
}

const DEFAULT_DATA_TESTID = 'data-testid';

function createDataAttribute(name: string, attributeName: string) {
  return t.jsxAttribute(t.jsxIdentifier(attributeName), t.stringLiteral(name));
}

function hasDataAttribute(
  node: t.JSXOpeningElement,
  attributeName: string
): boolean {
  return node.attributes.some(
    attribute =>
      t.isJSXAttribute(attribute)
      && t.isJSXIdentifier(attribute.name, { name: attributeName })
  );
}

type VisitorState = { name: string; attributes: string[] };

const returnStatementVisitor: Visitor<VisitorState> = {
  JSXFragment(path) {
    path.skip();
  },
  JSXElement(path, { name, attributes }) {
    const openingElement = path.get('openingElement');

    path.skip();

    for (const attribute of attributes) {
      if (!hasDataAttribute(openingElement.node, attribute)) {
        const dataAttribute = createDataAttribute(name, attribute);
        openingElement.node.attributes.push(dataAttribute);
      }
    }
  },
};

const functionVisitor: Visitor<VisitorState> = {
  ReturnStatement(path, state) {
    const arg = path.get('argument');
    if (!arg.isIdentifier()) {
      path.traverse(returnStatementVisitor, state);
    }
  },
};

type State = {
  opts: {
    attributes?: string[];
  };
};

function getElementName(node: t.JSXOpeningElement['name']): string {
  if (t.isJSXNamespacedName(node))
  {return [
    getElementName(node.namespace),
    getElementName(node.name),
  ].join(':');}

  if (t.isJSXIdentifier(node)) {return node.name;}

  return [
    getElementName(node.object),
    getElementName(node.property),
  ].join('.');
}

export default function plugin(): PluginObj<State> {
  return {
    name: 'cloudbeaver-data-testid',
    inherits: syntaxJsx,
    visitor: {
      'FunctionExpression|ArrowFunctionExpression|FunctionDeclaration': (
        path: NodePath<FunctionType>,
        state: State
      ) => {
        const identifier = nameForReactComponent(path);
        if (!identifier) {
          return;
        }

        const attributes = state.opts.attributes ?? [DEFAULT_DATA_TESTID];

        if (path.isArrowFunctionExpression()) {
          path.traverse(returnStatementVisitor, {
            name: identifier.name,
            attributes,
          });
        } else {
          path.traverse(functionVisitor, { name: identifier.name, attributes });
        }
      },
      CallExpression(p) {
        p.traverse({
          JSXOpeningElement({ node }) {
            const dataAttributeExists = node.attributes.find(
              attribute => t.isJSXAttribute(attribute) && attribute.name.name === DEFAULT_DATA_TESTID
            );

            if (dataAttributeExists) {
              return;
            }

            const newProp = t.jSXAttribute(
              t.jSXIdentifier(DEFAULT_DATA_TESTID),
              t.stringLiteral(getElementName(node.name))
            );
            node.attributes.push(newProp);
          },
        });
      },
    },
  } as PluginObj<State>;
}