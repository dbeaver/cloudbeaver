/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

// Keep these hooks aligned with core-ui's FormPart.
const publicMethods = new Set(['isLoading', 'isOutdated', 'isLoadable', 'isLoaded', 'isError', 'save', 'load', 'reload', 'reset', 'dispose']);
const publicGetters = new Set(['isDisabled', 'isChanged']);
const protectedMethods = new Set(['setInitialState', 'setState', 'prepare', 'format', 'validate', 'loader', 'saveChanges']);
const stateMembers = new Set(['state', 'initialState']);
const stateOperations = new Set(['setState', 'setInitialState']);
const inheritedObservableFields = new Set(['state', 'initialState', 'isSaving', 'isReadOnly', 'exception', 'promise', 'schema', 'loaded', 'loading']);

function getParameter(node) {
  return node.parameter.type === 'AssignmentPattern' ? node.parameter.left : node.parameter;
}

function getMemberName(node) {
  if (node.type === 'TSParameterProperty') {
    return getParameter(node).name;
  }

  if (node.key?.type === 'PrivateIdentifier') {
    return `#${node.key.name}`;
  }

  if (node.key?.type === 'Identifier' && !node.computed) {
    return node.key.name;
  }

  if (node.key?.type === 'Literal' && typeof node.key.value === 'string') {
    return node.key.value;
  }

  return null;
}

function unwrap(node) {
  while (node && ['ChainExpression', 'TSAsExpression', 'TSTypeAssertion', 'TSNonNullExpression', 'TSSatisfiesExpression'].includes(node.type)) {
    node = node.expression;
  }

  return node;
}

function isRootedInThis(node) {
  node = unwrap(node);

  while (node?.type === 'MemberExpression') {
    node = unwrap(node.object);
  }

  return node?.type === 'ThisExpression';
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Restrict FormPart to state-related public operations and non-observable public fields.',
    },
    schema: [],
    messages: {
      observableField: 'FormPart must not expose observable field "{{name}}". Move editable data into state or keep the field non-public.',
      unrelatedMember: 'Public FormPart member "{{name}}" must access form state, directly or through same-class helpers.',
      publicSetter: 'FormPart must not expose setter "{{name}}". Use an explicit operation or update state.',
      lifecycleKind: 'FormPart lifecycle member "{{name}}" must be an instance {{kind}}.',
      visibility: 'FormPart lifecycle member "{{name}}" must be {{visibility}}.',
      missingOverride: 'FormPart lifecycle member "{{name}}" must explicitly use override.',
    },
  },
  create: function create(context) {
    const sourceCode = context.sourceCode;

    function getImport(identifier) {
      let scope = sourceCode.getScope(identifier);

      while (scope) {
        const variable = scope.set.get(identifier.name);

        if (variable) {
          return variable.defs.find(definition => definition.type === 'ImportBinding')?.node;
        }

        scope = scope.upper;
      }

      return null;
    }

    function isFrameworkImport(node, source, names, allowType = false) {
      node = unwrap(node);
      let specifier;
      let name;

      if (node?.type === 'Identifier') {
        specifier = getImport(node);

        if (specifier?.type !== 'ImportSpecifier') {
          return false;
        }

        name = specifier.imported.name ?? specifier.imported.value;
      } else if (
        (node?.type === 'MemberExpression' && node.object.type === 'Identifier') ||
        (node?.type === 'TSQualifiedName' && node.left.type === 'Identifier')
      ) {
        specifier = getImport(node.object ?? node.left);

        if (specifier?.type !== 'ImportNamespaceSpecifier') {
          return false;
        }

        name = getMemberName({ key: node.property ?? node.right, computed: node.computed });
      } else {
        return false;
      }

      return (
        specifier.parent.source.value === source &&
        names.includes(name) &&
        (allowType || (specifier.importKind !== 'type' && specifier.parent.importKind !== 'type'))
      );
    }

    function isObservableAnnotation(node) {
      node = unwrap(node);

      if (node?.type === 'Literal' && node.value === true) {
        return true;
      }

      if (node?.type === 'CallExpression') {
        node = unwrap(node.callee);
      }

      while (node) {
        if (isFrameworkImport(node, 'mobx', ['observable', 'computed'])) {
          return true;
        }

        node = node.type === 'MemberExpression' ? unwrap(node.object) : null;
      }

      return false;
    }

    function getObservableFields(members) {
      const fields = [];

      for (const member of members) {
        if (member.kind === 'constructor') {
          fields.push(...member.value.params.filter(parameter => parameter.type === 'TSParameterProperty'));
        } else if (!['MethodDefinition', 'TSAbstractMethodDefinition', 'StaticBlock'].includes(member.type)) {
          fields.push(member);
        }
      }

      const observableFields = new Set();

      function mark(name) {
        if (name === null || name === undefined) {
          return;
        }

        for (const field of fields) {
          if (!field.static && getMemberName(field) === name) {
            observableFields.add(field);
          }
        }
      }

      function isObservableValue(value) {
        value = unwrap(value);
        return value?.type === 'CallExpression' && isObservableAnnotation(value.callee);
      }

      function properties(node) {
        node = unwrap(node);
        return node?.type === 'ObjectExpression' ? node.properties.filter(property => property.type === 'Property') : [];
      }

      for (const field of fields) {
        const initialValue = field.type === 'TSParameterProperty' ? field.parameter.right : field.value;

        if (
          (!field.static && inheritedObservableFields.has(getMemberName(field))) ||
          isObservableValue(initialValue) ||
          field.decorators?.some(decorator => isObservableAnnotation(decorator.expression))
        ) {
          observableFields.add(field);
        }
      }

      function visit(node, root) {
        if (!node || (node !== root && ['ClassDeclaration', 'ClassExpression', 'FunctionDeclaration', 'FunctionExpression'].includes(node.type))) {
          return;
        }

        if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && isObservableValue(node.right)) {
          if (unwrap(node.left.object)?.type === 'ThisExpression') {
            mark(getMemberName({ key: node.left.property, computed: node.left.computed }));
          }
        }

        if (node.type === 'CallExpression' && unwrap(node.arguments[0])?.type === 'ThisExpression') {
          if (isFrameworkImport(node.callee, 'mobx', ['makeObservable'])) {
            for (const property of properties(node.arguments[1])) {
              if (isObservableAnnotation(property.value)) {
                mark(getMemberName(property));
              }
            }
          } else if (isFrameworkImport(node.callee, 'mobx', ['makeAutoObservable', 'extendObservable'])) {
            const auto = isFrameworkImport(node.callee, 'mobx', ['makeAutoObservable']);
            const annotations = properties(node.arguments[auto ? 1 : 2]);
            const candidates = auto ? fields.filter(field => !field.static) : properties(node.arguments[1]);

            for (const candidate of candidates) {
              const name = getMemberName(candidate);
              const annotation = annotations.find(property => getMemberName(property) === name);
              const observable = annotation
                ? isObservableAnnotation(annotation.value)
                : !['FunctionExpression', 'ArrowFunctionExpression'].includes(candidate.value?.type);

              if (observable) {
                mark(name);
              }
            }
          }
        }

        for (const key of sourceCode.visitorKeys[node.type] ?? []) {
          const child = node[key];

          if (Array.isArray(child)) {
            child.forEach(child => visit(child, root));
          } else {
            visit(child, root);
          }
        }
      }

      for (const member of members) {
        if (!member.static) {
          visit(member.value, member.value);
        }
      }

      return observableFields;
    }

    function getStateRelations(members) {
      const relations = new Map();
      const helpers = new Map();

      for (const member of members) {
        if (member.static || member.kind === 'set' || member.kind === 'constructor') {
          continue;
        }

        const root = member.value;

        if (!root || !['FunctionExpression', 'ArrowFunctionExpression', 'TSEmptyBodyFunctionExpression'].includes(root.type)) {
          continue;
        }

        const relation = { state: false, references: new Set() };

        function visit(node) {
          if (!node) {
            return;
          }

          if (node !== root && ['ClassDeclaration', 'ClassExpression', 'FunctionDeclaration', 'FunctionExpression'].includes(node.type)) {
            return;
          }

          if (node.type === 'MemberExpression') {
            const name = getMemberName({ key: node.property, computed: node.computed });

            if (stateMembers.has(name) && isRootedInThis(node.object)) {
              relation.state = true;
            }

            if (unwrap(node.object)?.type === 'ThisExpression' && name !== null) {
              relation.references.add(name);
            }
          }

          if (node.type === 'CallExpression') {
            const callee = unwrap(node.callee);

            if (
              callee?.type === 'MemberExpression' &&
              unwrap(callee.object)?.type === 'ThisExpression' &&
              stateOperations.has(getMemberName({ key: callee.property, computed: callee.computed }))
            ) {
              relation.state = true;
            }
          }

          for (const key of sourceCode.visitorKeys[node.type] ?? []) {
            const child = node[key];

            if (Array.isArray(child)) {
              child.forEach(visit);
            } else {
              visit(child);
            }
          }
        }

        visit(root);
        relations.set(member, relation);

        const name = getMemberName(member);

        if (name !== null) {
          const definitions = helpers.get(name) ?? [];
          definitions.push(member);
          helpers.set(name, definitions);
        }
      }

      function accessesState(member, seen = new Set()) {
        if (seen.has(member)) {
          return false;
        }

        seen.add(member);
        const relation = relations.get(member);

        return (
          !!relation &&
          (relation.state || [...relation.references].some(name => (helpers.get(name) ?? []).some(helper => accessesState(helper, seen))))
        );
      }

      return accessesState;
    }

    function checkMember(member, accessesState, observableFields) {
      if (member.key?.type === 'PrivateIdentifier') {
        return;
      }

      const name = getMemberName(member);
      const data = { name: name ?? sourceCode.getText(member.key ?? member) };
      let visibility;

      if (publicMethods.has(name) || publicGetters.has(name)) {
        visibility = 'public';
      } else if (protectedMethods.has(name)) {
        visibility = 'protected';
      }

      const isMethod = member.type === 'MethodDefinition' || member.type === 'TSAbstractMethodDefinition';

      if (visibility) {
        const kind = publicGetters.has(name) ? 'get' : 'method';

        if (!isMethod || member.static || member.kind !== kind) {
          context.report({ node: member, messageId: 'lifecycleKind', data: { ...data, kind: kind === 'get' ? 'getter' : 'method' } });
        } else if ((member.accessibility ?? 'public') !== visibility) {
          context.report({ node: member, messageId: 'visibility', data: { ...data, visibility } });
        } else if (!member.override) {
          context.report({ node: member, messageId: 'missingOverride', data });
        }

        return;
      }

      if ((member.accessibility ?? 'public') !== 'public') {
        return;
      }

      if (isMethod) {
        if (member.kind === 'set') {
          context.report({ node: member, messageId: 'publicSetter', data });
        } else if (member.static || !accessesState(member)) {
          context.report({ node: member, messageId: 'unrelatedMember', data });
        }
      } else if (name !== 'progress' && observableFields.has(member)) {
        context.report({ node: member, messageId: 'observableField', data });
      }
    }

    function checkClass(node) {
      if (!isFrameworkImport(node.superClass, '@cloudbeaver/core-ui', ['FormPart'])) {
        return;
      }

      const accessesState = getStateRelations(node.body.body);
      const observableFields = getObservableFields(node.body.body);

      for (const member of node.body.body) {
        if (member.type === 'StaticBlock') {
          continue;
        }

        if (member.type === 'MethodDefinition' && member.kind === 'constructor') {
          for (const parameter of member.value.params) {
            if (parameter.type === 'TSParameterProperty') {
              checkMember(parameter, accessesState, observableFields);
            }
          }

          continue;
        }

        checkMember(member, accessesState, observableFields);
      }
    }

    return {
      ClassDeclaration: checkClass,
      ClassExpression: checkClass,
    };
  },
};
