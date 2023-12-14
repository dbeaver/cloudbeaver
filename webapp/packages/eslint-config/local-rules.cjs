const rule = {
  meta: {
    docs: {
      description: 'Reshadow package is deprecated',
    },
  },
  create: function (context) {
    return {
      ImportDeclaration(node) {
        const moduleName = node.source.value;
        if (moduleName === 'reshadow') {
          context.report({
            node,
            message: 'This package is deprecated. Use CSS modules instead.',
          });
        }
      },
    };
  },
};

module.exports = {
  'no-deprecated-reshadow': rule,
};
