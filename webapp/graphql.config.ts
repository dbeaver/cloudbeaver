import type { IGraphQLConfig } from 'graphql-config';

const config: IGraphQLConfig = {
  schema: ['../server/bundles/*/schema/**/*.graphqls'],
  documents: './packages/*/src/**/*.gql',
};

export default config;
