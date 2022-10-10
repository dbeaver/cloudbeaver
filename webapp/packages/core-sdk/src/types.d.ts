export module 'graphql/error/GraphQLError' {
  export interface GraphQLErrorExtensions {
    stackTrace?: string;
    webErrorCode?: string;
  }
}
