/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

const BLOCK_LIKE_STATEMENTS = new Set([
  'DoWhileStatement',
  'ForInStatement',
  'ForOfStatement',
  'ForStatement',
  'IfStatement',
  'SwitchStatement',
  'TryStatement',
  'WhileStatement',
]);

const DECLARATION_STATEMENTS = new Set([
  'ClassDeclaration',
  'FunctionDeclaration',
  'TSEnumDeclaration',
  'TSInterfaceDeclaration',
  'TSModuleDeclaration',
]);

const MODULE_LINK_STATEMENTS = new Set(['ExportAllDeclaration', 'ImportDeclaration', 'TSExportAssignment', 'TSImportEqualsDeclaration']);

const SHORTEST_PADDED_BODY = 3;

const declarationOf = node => node.declaration ?? node;

const isModuleLink = node => MODULE_LINK_STATEMENTS.has(node.type) || (node.type === 'ExportNamedDeclaration' && !node.declaration);

const opensParagraph = (node, statementCount) => {
  const declared = declarationOf(node);

  return (
    (node.type === 'ReturnStatement' && statementCount >= SHORTEST_PADDED_BODY) ||
    BLOCK_LIKE_STATEMENTS.has(declared.type) ||
    DECLARATION_STATEMENTS.has(declared.type)
  );
};

const closesParagraph = (node, spansLines) => {
  const declared = declarationOf(node);

  return spansLines || BLOCK_LIKE_STATEMENTS.has(declared.type) || DECLARATION_STATEMENTS.has(declared.type);
};

export default {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    docs: {
      description:
        'Require blank lines around blocks and declarations, after multiline statements, and before returns in bodies of three or more statements.',
    },
    schema: [],
    messages: {
      missingBlankLine: 'Add a blank line above this statement to separate logical steps.',
    },
  },
  create(context) {
    const filename = context.filename ?? '';

    if (filename.endsWith('.d.ts') || filename.includes('.generated.') || filename.includes('.gen.')) {
      return {};
    }

    const { sourceCode } = context;
    const newline = sourceCode.text.includes('\r\n') ? '\r\n' : '\n';

    const check = statements => {
      let previous;

      for (const current of statements) {
        const preceding = previous;
        previous = current;

        if (preceding === undefined || (isModuleLink(preceding) && isModuleLink(current))) {
          continue;
        }

        const precedingLoc = preceding.loc;
        const leading = sourceCode.getCommentsBefore(current).find(comment => comment.loc.start.line > precedingLoc.end.line);
        const anchor = leading ?? sourceCode.getFirstToken(current) ?? current;
        const anchorStart = anchor.loc.start;

        if (anchorStart.line - precedingLoc.end.line !== 1) {
          continue;
        }

        const spansLines = precedingLoc.end.line > precedingLoc.start.line;

        if (!opensParagraph(current, statements.length) && !closesParagraph(preceding, spansLines)) {
          continue;
        }

        const insertAt = sourceCode.getIndexFromLoc({ line: anchorStart.line, column: 0 });

        context.report({
          node: anchor,
          messageId: 'missingBlankLine',
          fix: fixer => fixer.insertTextBeforeRange([insertAt, insertAt], newline),
        });
      }
    };

    return {
      Program: node => check(node.body),
      BlockStatement: node => check(node.body),
      StaticBlock: node => check(node.body),
      SwitchCase: node => check(node.consequent),
      TSModuleBlock: node => check(node.body),
    };
  },
};
