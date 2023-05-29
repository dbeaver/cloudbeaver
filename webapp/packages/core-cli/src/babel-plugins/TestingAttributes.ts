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
import type { NodePath, PluginObj, Visitor } from '@babel/core';
import syntaxJsx from '@babel/plugin-syntax-jsx';
import * as t from '@babel/types';

type FunctionType = t.FunctionDeclaration | t.FunctionExpression | t.ArrowFunctionExpression;

function addTestIdAttribute(node: t.JSXOpeningElement, name: string): void {
  if (!hasDataAttribute(node, DEFAULT_DATA_TESTID)) {
    const dataAttribute = createDataAttribute(name, DEFAULT_DATA_TESTID);
    const indexOf = node.attributes.findIndex(attribute => t.isJSXSpreadAttribute(attribute));
    if (indexOf !== -1) {
      node.attributes.splice(indexOf, 0, dataAttribute);
    } else {
      node.attributes.push(dataAttribute);
    }
  }
}

function nameForReactComponent(path: NodePath<FunctionType>): t.Identifier | null {
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

function hasDataAttribute(node: t.JSXOpeningElement, attributeName: string): boolean {
  return node.attributes.some(attribute => t.isJSXAttribute(attribute) && t.isJSXIdentifier(attribute.name, { name: attributeName }));
}

type VisitorState = { name: string };

const returnStatementVisitor: Visitor<VisitorState> = {
  JSXFragment(path) {
    path.skip();
  },
  JSXElement(path, { name }) {
    const openingElement = path.get('openingElement');

    path.skip();

    addTestIdAttribute(openingElement.node, name);
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

function getElementName(node: t.JSXOpeningElement['name']): string {
  if (t.isJSXNamespacedName(node)) {
    return [getElementName(node.namespace), getElementName(node.name)].join(':');
  }

  if (t.isJSXIdentifier(node)) {
    return node.name;
  }

  return [getElementName(node.object), getElementName(node.property)].join('.');
}

export default function plugin(): PluginObj {
  return {
    name: 'cloudbeaver-data-testid',
    inherits: syntaxJsx,
    visitor: {
      'FunctionExpression|ArrowFunctionExpression|FunctionDeclaration': (p: NodePath<FunctionType>) => {
        const identifier = nameForReactComponent(p);
        if (!identifier) {
          return;
        }

        if (p.isArrowFunctionExpression()) {
          p.traverse(returnStatementVisitor, { name: identifier.name });
        } else {
          p.traverse(functionVisitor, { name: identifier.name });
        }
      },
      CallExpression(p) {
        p.traverse({
          JSXOpeningElement({ node }) {
            addTestIdAttribute(node, getElementName(node.name));
          },
        });
      },
    },
  } as PluginObj;
}
