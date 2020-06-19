export module 'graphql-request/dist/src/types' {
  export interface GraphQLError {
    extensions?: {
      stackTrace?: string;
      webErrorCode?: string;
    };
  }
}
