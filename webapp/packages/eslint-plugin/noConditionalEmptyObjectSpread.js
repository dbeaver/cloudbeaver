/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

function unwrapParentheses(node) {
  let current = node;

  while (current.type === 'ParenthesizedExpression') {
    current = current.expression;
  }

  return current;
}

function isEmptyObjectExpression(node) {
  const unwrapped = unwrapParentheses(node);

  return unwrapped.type === 'ObjectExpression' && unwrapped.properties.length === 0;
}

function isConditionalEmptyObjectSpread(node) {
  const conditional = unwrapParentheses(node);

  return (
    conditional.type === 'ConditionalExpression' &&
    (isEmptyObjectExpression(conditional.consequent) || isEmptyObjectExpression(conditional.alternate))
  );
}

export default {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Disallow object spreads that conditionally spread an empty object to omit fields.',
    },
    schema: [],
    messages: {
      conditionalEmptyObject:
        'This conditional spread hides property omission behind an empty object. Build the object in separate statements and add the property only when present.',
    },
  },
  create(context) {
    return {
      SpreadElement(node) {
        if (node.parent.type !== 'ObjectExpression') {
          return;
        }

        if (isConditionalEmptyObjectSpread(node.argument)) {
          context.report({ node, messageId: 'conditionalEmptyObject' });
        }
      },
    };
  },
};
