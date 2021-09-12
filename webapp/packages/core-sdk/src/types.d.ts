export module 'graphql-request/dist/types' {
  export interface GraphQLError {
    extensions?: {
      stackTrace?: string;
      webErrorCode?: string;
    };
  }
}
