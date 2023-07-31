import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: '../../../server/bundles/*/schema/**/*.graphqls',
  documents: './src/**/*.gql',
  generates: {
    './src/sdk.ts': {
      plugins: [{ add: { content: '/* eslint-disable */' } }, 'typescript', 'typescript-operations', 'typescript-graphql-request'],
    },
  },
  config: {
    skipTypename: true,
    documentMode: 'string',
    useTypeImports: true,
    avoidOptionals: {
      field: false,
      inputValue: false,
      object: false,
    },
    maybeValue: 'T', // T | null'
    declarationKind: {
      union: 'type',
      type: 'interface',
      input: 'interface',
      scalar: 'interface',
      arguments: 'interface',
    },
    scalars: {
      Object: 'any',
      JSON: '{ [key: string]: any }',
      DateTime: 'any',
    },
  },
  hooks: {
    afterAllFileWrite: ['prettier --write'],
  },
};

export default config;
