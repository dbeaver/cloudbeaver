/* eslint-disable max-len */
import { GraphQLClient } from 'graphql-request';

export type Maybe<T> = T;

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Object: any;
  DateTime: any;
};

export type AdminPermissionInfo = {
  id: Scalars['ID'];
  label?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  provider: Scalars['String'];
  category?: Maybe<Scalars['String']>;
};

export type AdminRoleInfo = {
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  rolePermissions: Array<Maybe<Scalars['ID']>>;
};

export type AdminUserInfo = {
  userId: Scalars['ID'];
  metaParameters: Scalars['Object'];
  configurationParameters: Scalars['Object'];
  grantedRoles: Array<Maybe<Scalars['ID']>>;
};

export type AsyncTaskInfo = {
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  running: Scalars['Boolean'];
  status?: Maybe<Scalars['String']>;
  error?: Maybe<ServerError>;
  result?: Maybe<SqlExecuteInfo>;
  taskResult?: Maybe<Scalars['Object']>;
};

export enum AuthCredentialEncryption {
  None = 'none',
  Plain = 'plain',
  Hash = 'hash'
}

export type AuthCredentialInfo = {
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  admin?: Maybe<Scalars['Boolean']>;
  user?: Maybe<Scalars['Boolean']>;
  possibleValues?: Maybe<Array<Maybe<Scalars['String']>>>;
  encryption?: Maybe<AuthCredentialEncryption>;
};

export type AuthProviderInfo = {
  id: Scalars['ID'];
  label: Scalars['String'];
  icon?: Maybe<Scalars['ID']>;
  description?: Maybe<Scalars['String']>;
  defaultProvider?: Maybe<Scalars['Boolean']>;
  credentialParameters: Array<AuthCredentialInfo>;
};

export type ConnectionConfig = {
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  dataSourceId?: Maybe<Scalars['ID']>;
  driverId?: Maybe<Scalars['ID']>;
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['String']>;
  databaseName?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  userName?: Maybe<Scalars['String']>;
  userPassword?: Maybe<Scalars['String']>;
};

export type ConnectionInfo = {
  id: Scalars['ID'];
  driverId: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['String']>;
  connected: Scalars['Boolean'];
  provided: Scalars['Boolean'];
  connectTime?: Maybe<Scalars['String']>;
  connectionError?: Maybe<ServerError>;
  serverVersion?: Maybe<Scalars['String']>;
  clientVersion?: Maybe<Scalars['String']>;
  features: Array<Scalars['String']>;
};

export type DatabaseObjectInfo = {
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  ordinalPosition?: Maybe<Scalars['Int']>;
  fullyQualifiedName?: Maybe<Scalars['String']>;
  overloadedName?: Maybe<Scalars['String']>;
  uniqueName?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  features?: Maybe<Array<Maybe<Scalars['String']>>>;
  editors?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type DatabaseObjectInfoPropertiesArgs = {
  filter?: Maybe<ObjectPropertyFilter>;
};

export type DatabaseStructContainers = {
  catalogList: Array<DatabaseObjectInfo>;
  schemaList: Array<DatabaseObjectInfo>;
};

export type DataSourceInfo = {
  id: Scalars['ID'];
  driverId: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  host?: Maybe<Scalars['String']>;
  server?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['String']>;
};

export type DataTransferParameters = {
  processorId: Scalars['ID'];
  settings?: Maybe<Scalars['Object']>;
  processorProperties: Scalars['Object'];
  filter?: Maybe<SqlDataFilter>;
};

export type DataTransferProcessorInfo = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  fileExtension?: Maybe<Scalars['String']>;
  appFileExtension?: Maybe<Scalars['String']>;
  appName?: Maybe<Scalars['String']>;
  order: Scalars['Int'];
  icon?: Maybe<Scalars['String']>;
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  isBinary?: Maybe<Scalars['Boolean']>;
  isHTML?: Maybe<Scalars['Boolean']>;
};

export type DriverInfo = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  iconBig?: Maybe<Scalars['String']>;
  providerId?: Maybe<Scalars['ID']>;
  driverClassName?: Maybe<Scalars['String']>;
  defaultPort?: Maybe<Scalars['String']>;
  sampleURL?: Maybe<Scalars['String']>;
  driverInfoURL?: Maybe<Scalars['String']>;
  driverPropertiesURL?: Maybe<Scalars['String']>;
  embedded?: Maybe<Scalars['Boolean']>;
  anonymousAccess?: Maybe<Scalars['Boolean']>;
  allowsEmptyPassword?: Maybe<Scalars['Boolean']>;
  licenseRequired?: Maybe<Scalars['Boolean']>;
  license?: Maybe<Scalars['String']>;
  custom?: Maybe<Scalars['Boolean']>;
  promotedScore?: Maybe<Scalars['Int']>;
  connectionProperties?: Maybe<Scalars['Object']>;
  defaultConnectionProperties?: Maybe<Scalars['Object']>;
  driverProperties?: Maybe<Array<Maybe<DriverPropertyInfo>>>;
  driverParameters?: Maybe<Scalars['Object']>;
};

export type DriverPropertyInfo = {
  id: Scalars['ID'];
  displayName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  category?: Maybe<Scalars['String']>;
  dataType?: Maybe<Scalars['String']>;
  defaultValue?: Maybe<Scalars['Object']>;
  validValues?: Maybe<Array<Maybe<Scalars['Object']>>>;
};

export type LogEntry = {
  time?: Maybe<Scalars['DateTime']>;
  type: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
};

export type Mutation = {
  asyncSqlExecuteQuery: AsyncTaskInfo;
  asyncTaskCancel?: Maybe<Scalars['Boolean']>;
  asyncTaskStatus: AsyncTaskInfo;
  changeSessionLanguage?: Maybe<Scalars['Boolean']>;
  closeConnection: Scalars['Boolean'];
  closeSession?: Maybe<Scalars['Boolean']>;
  createConnection: ConnectionInfo;
  openConnection: ConnectionInfo;
  openSession: SessionInfo;
  readDataFromContainer?: Maybe<SqlExecuteInfo>;
  sqlContextCreate: SqlContextInfo;
  sqlContextDestroy: Scalars['Boolean'];
  sqlContextSetDefaults: Scalars['Boolean'];
  sqlExecuteQuery?: Maybe<SqlExecuteInfo>;
  sqlResultClose: Scalars['Boolean'];
  testConnection: ConnectionInfo;
  touchSession?: Maybe<Scalars['Boolean']>;
  updateResultsData?: Maybe<SqlExecuteInfo>;
};

export type MutationAsyncSqlExecuteQueryArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  sql: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
};

export type MutationAsyncTaskCancelArgs = {
  id: Scalars['String'];
};

export type MutationAsyncTaskStatusArgs = {
  id: Scalars['String'];
};

export type MutationChangeSessionLanguageArgs = {
  locale?: Maybe<Scalars['String']>;
};

export type MutationCloseConnectionArgs = {
  id: Scalars['ID'];
};

export type MutationCreateConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationOpenConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationReadDataFromContainerArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
};

export type MutationSqlContextCreateArgs = {
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
};

export type MutationSqlContextDestroyArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
};

export type MutationSqlContextSetDefaultsArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
};

export type MutationSqlExecuteQueryArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  sql: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
};

export type MutationSqlResultCloseArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
};

export type MutationTestConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationUpdateResultsDataArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updateRow: Array<Maybe<Scalars['Object']>>;
  updateValues?: Maybe<Scalars['Object']>;
};

export type NavigatorNodeInfo = {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  nodeType?: Maybe<Scalars['String']>;
  hasChildren?: Maybe<Scalars['Boolean']>;
  object?: Maybe<DatabaseObjectInfo>;
  features?: Maybe<Array<Maybe<Scalars['String']>>>;
  folder?: Maybe<Scalars['Boolean']>;
  inline?: Maybe<Scalars['Boolean']>;
  navigable?: Maybe<Scalars['Boolean']>;
};

export type ObjectDescriptor = {
  id?: Maybe<Scalars['Int']>;
  displayName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  uniqueName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
};

export type ObjectPropertyFilter = {
  ids?: Maybe<Array<Maybe<Scalars['String']>>>;
  features?: Maybe<Array<Maybe<Scalars['String']>>>;
  categories?: Maybe<Array<Maybe<Scalars['String']>>>;
  dataTypes?: Maybe<Array<Maybe<Scalars['String']>>>;
};

export type ObjectPropertyInfo = {
  id?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  category?: Maybe<Scalars['String']>;
  dataType?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
  validValues?: Maybe<Array<Maybe<Scalars['Object']>>>;
  defaultValue?: Maybe<Scalars['Object']>;
  features: Array<Scalars['String']>;
};

export type Query = {
  authLogin: UserAuthInfo;
  authLogout?: Maybe<Scalars['Boolean']>;
  authProviders: Array<AuthProviderInfo>;
  connectionState: ConnectionInfo;
  createRole: AdminRoleInfo;
  createUser: AdminUserInfo;
  dataSourceList: Array<DataSourceInfo>;
  dataTransferAvailableStreamProcessors: Array<DataTransferProcessorInfo>;
  dataTransferExportDataFromContainer: AsyncTaskInfo;
  dataTransferExportDataFromResults: AsyncTaskInfo;
  dataTransferRemoveDataFile?: Maybe<Scalars['Boolean']>;
  deleteRole?: Maybe<Scalars['Boolean']>;
  deleteUser?: Maybe<Scalars['Boolean']>;
  driverList: Array<DriverInfo>;
  grantUserRole?: Maybe<Scalars['Boolean']>;
  listPermissions: Array<Maybe<AdminPermissionInfo>>;
  listRoles: Array<Maybe<AdminRoleInfo>>;
  listUsers: Array<Maybe<AdminUserInfo>>;
  metadataGetNodeDDL?: Maybe<Scalars['String']>;
  navGetStructContainers: DatabaseStructContainers;
  navNodeChildren: Array<NavigatorNodeInfo>;
  navNodeInfo: NavigatorNodeInfo;
  navRefreshNode?: Maybe<Scalars['Boolean']>;
  readSessionLog: Array<LogEntry>;
  revokeUserRole?: Maybe<Scalars['Boolean']>;
  serverConfig: ServerConfig;
  sessionPermissions: Array<Maybe<Scalars['ID']>>;
  sessionState: SessionInfo;
  sessionUser?: Maybe<UserAuthInfo>;
  setRolePermissions?: Maybe<Scalars['Boolean']>;
  setUserCredentials?: Maybe<Scalars['Boolean']>;
  sqlCompletionProposals?: Maybe<Array<Maybe<SqlCompletionProposal>>>;
  sqlDialectInfo?: Maybe<SqlDialectInfo>;
  sqlListContexts?: Maybe<Array<Maybe<SqlContextInfo>>>;
};

export type QueryAuthLoginArgs = {
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
};

export type QueryConnectionStateArgs = {
  id: Scalars['ID'];
};

export type QueryCreateRoleArgs = {
  roleId: Scalars['ID'];
};

export type QueryCreateUserArgs = {
  userId: Scalars['ID'];
};

export type QueryDataTransferExportDataFromContainerArgs = {
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
};

export type QueryDataTransferExportDataFromResultsArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
};

export type QueryDataTransferRemoveDataFileArgs = {
  dataFileId: Scalars['String'];
};

export type QueryDeleteRoleArgs = {
  roleId: Scalars['ID'];
};

export type QueryDeleteUserArgs = {
  userId: Scalars['ID'];
};

export type QueryDriverListArgs = {
  id?: Maybe<Scalars['ID']>;
};

export type QueryGrantUserRoleArgs = {
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
};

export type QueryListRolesArgs = {
  roleId?: Maybe<Scalars['ID']>;
};

export type QueryListUsersArgs = {
  userId?: Maybe<Scalars['ID']>;
};

export type QueryMetadataGetNodeDdlArgs = {
  nodeId: Scalars['ID'];
  options?: Maybe<Scalars['Object']>;
};

export type QueryNavGetStructContainersArgs = {
  connectionId: Scalars['ID'];
  catalog?: Maybe<Scalars['ID']>;
};

export type QueryNavNodeChildrenArgs = {
  parentPath: Scalars['ID'];
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  onlyFolders?: Maybe<Scalars['Boolean']>;
};

export type QueryNavNodeInfoArgs = {
  nodePath: Scalars['ID'];
};

export type QueryNavRefreshNodeArgs = {
  nodePath: Scalars['ID'];
};

export type QueryReadSessionLogArgs = {
  maxEntries?: Maybe<Scalars['Int']>;
  clearEntries?: Maybe<Scalars['Boolean']>;
};

export type QueryRevokeUserRoleArgs = {
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
};

export type QuerySetRolePermissionsArgs = {
  roleId: Scalars['ID'];
  permissions: Array<Maybe<Scalars['ID']>>;
};

export type QuerySetUserCredentialsArgs = {
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
};

export type QuerySqlCompletionProposalsArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  position: Scalars['Int'];
  maxResults?: Maybe<Scalars['Int']>;
};

export type QuerySqlDialectInfoArgs = {
  connectionId: Scalars['ID'];
};

export type QuerySqlListContextsArgs = {
  connectionId: Scalars['ID'];
};

export type ServerConfig = {
  name: Scalars['String'];
  version: Scalars['String'];
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  supportsPredefinedConnections?: Maybe<Scalars['Boolean']>;
  supportsProvidedConnections?: Maybe<Scalars['Boolean']>;
  supportsCustomConnections?: Maybe<Scalars['Boolean']>;
  supportsConnectionBrowser?: Maybe<Scalars['Boolean']>;
  supportsWorkspaces?: Maybe<Scalars['Boolean']>;
  supportedLanguages: Array<ServerLanguage>;
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  productConfiguration: Scalars['Object'];
};

export type ServerError = {
  message?: Maybe<Scalars['String']>;
  errorCode?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
  causedBy?: Maybe<ServerError>;
};

export type ServerLanguage = {
  isoCode: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  nativeName?: Maybe<Scalars['String']>;
};

export type ServerMessage = {
  time?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type SessionInfo = {
  createTime: Scalars['String'];
  lastAccessTime: Scalars['String'];
  locale: Scalars['String'];
  cacheExpired: Scalars['Boolean'];
  serverMessages?: Maybe<Array<Maybe<ServerMessage>>>;
  connections: Array<ConnectionInfo>;
};

export type SqlCompletionProposal = {
  displayString?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  score?: Maybe<Scalars['Int']>;
  replacementString?: Maybe<Scalars['String']>;
  replacementOffset?: Maybe<Scalars['Int']>;
  replacementLength?: Maybe<Scalars['Int']>;
  cursorPosition?: Maybe<Scalars['Int']>;
  icon?: Maybe<Scalars['String']>;
  nodePath?: Maybe<Scalars['String']>;
};

export type SqlContextInfo = {
  id: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
};

export type SqlDataFilter = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  constraints?: Maybe<Array<Maybe<SqlDataFilterConstraint>>>;
  where?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Scalars['String']>;
};

export type SqlDataFilterConstraint = {
  attribute: Scalars['String'];
  orderPosition?: Maybe<Scalars['Int']>;
  orderAsc?: Maybe<Scalars['Boolean']>;
  criteria?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
};

export type SqlDialectInfo = {
  name?: Maybe<Scalars['String']>;
  dataTypes?: Maybe<Array<Maybe<Scalars['String']>>>;
  functions?: Maybe<Array<Maybe<Scalars['String']>>>;
  reservedWords?: Maybe<Array<Maybe<Scalars['String']>>>;
  quoteStrings?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  singleLineComments?: Maybe<Array<Maybe<Scalars['String']>>>;
  multiLineComments?: Maybe<Array<Maybe<Array<Maybe<Scalars['String']>>>>>;
  catalogSeparator?: Maybe<Scalars['String']>;
  structSeparator?: Maybe<Scalars['String']>;
  scriptDelimiter?: Maybe<Scalars['String']>;
};

export type SqlExecuteInfo = {
  statusMessage?: Maybe<Scalars['String']>;
  duration?: Maybe<Scalars['Int']>;
  results: Array<SqlQueryResults>;
};

export type SqlQueryResults = {
  title?: Maybe<Scalars['String']>;
  updateRowCount?: Maybe<Scalars['Int']>;
  sourceQuery?: Maybe<Scalars['String']>;
  resultSet?: Maybe<SqlResultSet>;
};

export type SqlResultColumn = {
  position?: Maybe<Scalars['Int']>;
  name?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  dataKind?: Maybe<Scalars['String']>;
  typeName?: Maybe<Scalars['String']>;
  fullTypeName?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Int']>;
  scale?: Maybe<Scalars['Int']>;
  precision?: Maybe<Scalars['Int']>;
};

export type SqlResultSet = {
  id: Scalars['ID'];
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars['Object']>>>>>;
  hasMoreData?: Maybe<Scalars['Boolean']>;
};

export type UserAuthInfo = {
  userId: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  authProvider: Scalars['String'];
  loginTime: Scalars['DateTime'];
  message?: Maybe<Scalars['String']>;
};

export type WebServiceConfig = {
  id: Scalars['String'];
  name: Scalars['String'];
  description: Scalars['String'];
  bundleVersion: Scalars['String'];
};

export type NavGetStructContainersQueryVariables = {
  connectionId: Scalars['ID'];
  catalogId?: Maybe<Scalars['ID']>;
};

export type NavGetStructContainersQuery = { navGetStructContainers: { catalogList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>>; schemaList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>> } };

export type CloseConnectionMutationVariables = {
  id: Scalars['ID'];
};

export type CloseConnectionMutation = Pick<Mutation, 'closeConnection'>;

export type ConnectionStateQueryVariables = {
  id: Scalars['ID'];
};

export type ConnectionStateQuery = { connection: Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'features'> };

export type CreateConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type CreateConnectionMutation = { createConnection: Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'features'> };

export type DataSourceListQueryVariables = {};

export type DataSourceListQuery = { dataSourceList: Array<Pick<DataSourceInfo, 'id' | 'name' | 'driverId' | 'description'>> };

export type DriverListQueryVariables = {};

export type DriverListQuery = { driverList: Array<Pick<DriverInfo, 'id' | 'name' | 'icon' | 'description' | 'defaultPort' | 'sampleURL' | 'embedded' | 'anonymousAccess' | 'promotedScore'>> };

export type DriverPropertiesQueryVariables = {
  driverId: Scalars['ID'];
};

export type DriverPropertiesQuery = { driver: Array<(
    Pick<DriverInfo, 'driverParameters'>
    & { driverProperties?: Maybe<Array<Maybe<Pick<DriverPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues'>>>> }
  )>; };

export type GetDriverByIdQueryVariables = {
  driverId: Scalars['ID'];
};

export type GetDriverByIdQuery = { driverList: Array<Pick<DriverInfo, 'id' | 'name' | 'icon'>> };

export type OpenConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type OpenConnectionMutation = { openConnection: Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'features'> };

export type TestConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type TestConnectionMutation = { testConnection: Pick<ConnectionInfo, 'id'> };

export type GetChildrenDbObjectInfoQueryVariables = {
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
};

export type GetChildrenDbObjectInfoQuery = { dbObjects: Array<(
    Pick<NavigatorNodeInfo, 'id'>
    & { object?: Maybe<(
      Pick<DatabaseObjectInfo, 'features'>
      & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value'>>>> }
    )>; }
  )>; };

export type GetDbObjectInfoQueryVariables = {
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
};

export type GetDbObjectInfoQuery = { objectInfo: { object?: Maybe<(
      Pick<DatabaseObjectInfo, 'features'>
      & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value'>>>> }
    )>; }; };

export type NavNodeChildrenQueryVariables = {
  parentPath: Scalars['ID'];
};

export type NavNodeChildrenQuery = { navNodeChildren: Array<(
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  )>; navNodeInfo: (
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  ); };

export type NavNodeInfoQueryVariables = {
  nodePath: Scalars['ID'];
};

export type NavNodeInfoQuery = { navNodeInfo: (
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  ); };

export type NavRefreshNodeQueryVariables = {
  nodePath: Scalars['ID'];
};

export type NavRefreshNodeQuery = Pick<Query, 'navRefreshNode'>;

export type ReadSessionLogQueryVariables = {
  maxEntries: Scalars['Int'];
  clearEntries: Scalars['Boolean'];
};

export type ReadSessionLogQuery = { log: Array<Pick<LogEntry, 'time' | 'type' | 'message' | 'stackTrace'>> };

export type ChangeSessionLanguageMutationVariables = {
  locale: Scalars['String'];
};

export type ChangeSessionLanguageMutation = Pick<Mutation, 'changeSessionLanguage'>;

export type CreateUserQueryVariables = {
  userId: Scalars['ID'];
};

export type CreateUserQuery = { user: Pick<AdminUserInfo, 'userId' | 'grantedRoles'> };

export type DeleteUserQueryVariables = {
  userId: Scalars['ID'];
};

export type DeleteUserQuery = Pick<Query, 'deleteUser'>;

export type GetPermissionsListQueryVariables = {
  roleId?: Maybe<Scalars['ID']>;
};

export type GetPermissionsListQuery = { permissions: Array<Maybe<Pick<AdminPermissionInfo, 'id' | 'label' | 'description' | 'provider' | 'category'>>> };

export type GetRolesListQueryVariables = {
  roleId?: Maybe<Scalars['ID']>;
};

export type GetRolesListQuery = { roles: Array<Maybe<Pick<AdminRoleInfo, 'roleId' | 'roleName'>>> };

export type GetUsersListQueryVariables = {
  userId?: Maybe<Scalars['ID']>;
};

export type GetUsersListQuery = { users: Array<Maybe<Pick<AdminUserInfo, 'userId' | 'grantedRoles'>>> };

export type GrantUserRoleQueryVariables = {
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
};

export type GrantUserRoleQuery = Pick<Query, 'grantUserRole'>;

export type SetUserCredentialsQueryVariables = {
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
};

export type SetUserCredentialsQuery = Pick<Query, 'setUserCredentials'>;

export type AuthLoginQueryVariables = {
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
};

export type AuthLoginQuery = { user: Pick<UserAuthInfo, 'userId' | 'displayName' | 'authProvider' | 'loginTime' | 'message'> };

export type AuthLogoutQueryVariables = {};

export type AuthLogoutQuery = Pick<Query, 'authLogout'>;

export type GetAuthProvidersQueryVariables = {};

export type GetAuthProvidersQuery = { providers: Array<(
    Pick<AuthProviderInfo, 'id' | 'label' | 'icon' | 'description' | 'defaultProvider'>
    & { credentialParameters: Array<Pick<AuthCredentialInfo, 'id' | 'displayName' | 'description' | 'admin' | 'user' | 'possibleValues' | 'encryption'>> }
  )>; };

export type GetSessionUserQueryVariables = {};

export type GetSessionUserQuery = { user?: Maybe<Pick<UserAuthInfo, 'userId' | 'displayName' | 'authProvider' | 'loginTime' | 'message'>> };

export type AsyncExportTaskStatusMutationVariables = {
  taskId: Scalars['String'];
};

export type AsyncExportTaskStatusMutation = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ); };

export type ExportDataFromContainerQueryVariables = {
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
};

export type ExportDataFromContainerQuery = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ); };

export type ExportDataFromResultsQueryVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
};

export type ExportDataFromResultsQuery = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ); };

export type GetDataTransferProcessorsQueryVariables = {};

export type GetDataTransferProcessorsQuery = { processors: Array<(
    Pick<DataTransferProcessorInfo, 'id' | 'name' | 'description' | 'fileExtension' | 'appFileExtension' | 'appName' | 'order' | 'icon' | 'isBinary' | 'isHTML'>
    & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues' | 'features'>>>> }
  )>; };

export type RemoveDataTransferFileQueryVariables = {
  dataFileId: Scalars['String'];
};

export type RemoveDataTransferFileQuery = { result: Query['dataTransferRemoveDataFile'] };

export type AsyncSqlExecuteQueryMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
};

export type AsyncSqlExecuteQueryMutation = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running'>
    & { result?: Maybe<(
      Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
      & { results: Array<(
        Pick<SqlQueryResults, 'updateRowCount' | 'sourceQuery' | 'title'>
        & { resultSet?: Maybe<(
          Pick<SqlResultSet, 'id' | 'rows'>
          & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'scale' | 'typeName'>>>> }
        )>; }
      )>; }
    )>; error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>>; }
  ); };

export type AsyncTaskCancelMutationVariables = {
  taskId: Scalars['String'];
};

export type AsyncTaskCancelMutation = { result: Mutation['asyncTaskCancel'] };

export type AsyncTaskStatusMutationVariables = {
  taskId: Scalars['String'];
};

export type AsyncTaskStatusMutation = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running'>
    & { result?: Maybe<(
      Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
      & { results: Array<(
        Pick<SqlQueryResults, 'updateRowCount' | 'sourceQuery' | 'title'>
        & { resultSet?: Maybe<(
          Pick<SqlResultSet, 'id' | 'rows'>
          & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'scale' | 'typeName'>>>> }
        )>; }
      )>; }
    )>; error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>>; }
  ); };

export type ExecuteSqlQueryMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
};

export type ExecuteSqlQueryMutation = { result?: Maybe<(
    Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount' | 'sourceQuery' | 'title'>
      & { resultSet?: Maybe<(
        Pick<SqlResultSet, 'id' | 'rows'>
        & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'scale' | 'typeName'>>>> }
      )>; }
    )>; }
  )>; };

export type MetadataGetNodeDdlQueryVariables = {
  nodeId: Scalars['ID'];
};

export type MetadataGetNodeDdlQuery = Pick<Query, 'metadataGetNodeDDL'>;

export type QuerySqlCompletionProposalsQueryVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  position: Scalars['Int'];
  query: Scalars['String'];
  maxResults?: Maybe<Scalars['Int']>;
};

export type QuerySqlCompletionProposalsQuery = { sqlCompletionProposals?: Maybe<Array<Maybe<Pick<SqlCompletionProposal, 'cursorPosition' | 'displayString' | 'icon' | 'nodePath' | 'replacementLength' | 'replacementOffset' | 'replacementString' | 'score' | 'type'>>>> };

export type QuerySqlDialectInfoQueryVariables = {
  connectionId: Scalars['ID'];
};

export type QuerySqlDialectInfoQuery = { dialect?: Maybe<Pick<SqlDialectInfo, 'name' | 'dataTypes' | 'functions' | 'reservedWords' | 'quoteStrings' | 'singleLineComments' | 'multiLineComments' | 'catalogSeparator' | 'structSeparator' | 'scriptDelimiter'>> };

export type ReadDataFromContainerMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
};

export type ReadDataFromContainerMutation = { readDataFromContainer?: Maybe<(
    Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount' | 'sourceQuery' | 'title'>
      & { resultSet?: Maybe<(
        Pick<SqlResultSet, 'id' | 'rows'>
        & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'scale' | 'typeName'>>>> }
      )>; }
    )>; }
  )>; };

export type SqlContextCreateMutationVariables = {
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
};

export type SqlContextCreateMutation = { context: Pick<SqlContextInfo, 'id' | 'defaultCatalog' | 'defaultSchema'> };

export type SqlContextDestroyMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
};

export type SqlContextDestroyMutation = Pick<Mutation, 'sqlContextDestroy'>;

export type SqlContextSetDefaultsMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
};

export type SqlContextSetDefaultsMutation = { context: Mutation['sqlContextSetDefaults'] };

export type SqlResultCloseMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
};

export type SqlResultCloseMutation = { result: Mutation['sqlResultClose'] };

export type UpdateResultsDataMutationVariables = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  sourceRowValues: Array<Maybe<Scalars['Object']>>;
  values?: Maybe<Scalars['Object']>;
};

export type UpdateResultsDataMutation = { result?: Maybe<(
    Pick<SqlExecuteInfo, 'duration'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount'>
      & { resultSet?: Maybe<Pick<SqlResultSet, 'id' | 'rows'>> }
    )>; }
  )>; };

export type OpenSessionMutationVariables = {};

export type OpenSessionMutation = { session: (
    Pick<SessionInfo, 'createTime' | 'lastAccessTime' | 'cacheExpired' | 'locale'>
    & { connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'features'>> }
  ); };

export type ServerConfigQueryVariables = {};

export type ServerConfigQuery = { serverConfig: (
    Pick<ServerConfig, 'name' | 'version' | 'productConfiguration' | 'supportsPredefinedConnections' | 'supportsProvidedConnections' | 'supportsCustomConnections' | 'supportsConnectionBrowser' | 'supportsWorkspaces' | 'anonymousAccessEnabled' | 'authenticationEnabled'>
    & { supportedLanguages: Array<Pick<ServerLanguage, 'isoCode' | 'displayName' | 'nativeName'>> }
  ); };

export type SessionPermissionsQueryVariables = {};

export type SessionPermissionsQuery = { permissions: Query['sessionPermissions'] };

export type SessionStateQueryVariables = {};

export type SessionStateQuery = { sessionState: (
    Pick<SessionInfo, 'createTime' | 'lastAccessTime' | 'locale' | 'cacheExpired'>
    & { connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'features'>> }
  ); };

export type TouchSessionMutationVariables = {};

export type TouchSessionMutation = Pick<Mutation, 'touchSession'>;

export const NavGetStructContainersDocument = `
    query navGetStructContainers($connectionId: ID!, $catalogId: ID) {
  navGetStructContainers(connectionId: $connectionId, catalog: $catalogId) {
    catalogList {
      name
      description
      type
      features
    }
    schemaList {
      name
      description
      type
      features
    }
  }
}
    `;
export const CloseConnectionDocument = `
    mutation closeConnection($id: ID!) {
  closeConnection(id: $id)
}
    `;
export const ConnectionStateDocument = `
    query connectionState($id: ID!) {
  connection: connectionState(id: $id) {
    id
    name
    driverId
    connected
    features
  }
}
    `;
export const CreateConnectionDocument = `
    mutation createConnection($config: ConnectionConfig!) {
  createConnection(config: $config) {
    id
    name
    driverId
    connected
    features
  }
}
    `;
export const DataSourceListDocument = `
    query dataSourceList {
  dataSourceList {
    id
    name
    driverId
    description
  }
}
    `;
export const DriverListDocument = `
    query driverList {
  driverList {
    id
    name
    icon
    description
    defaultPort
    sampleURL
    embedded
    anonymousAccess
    promotedScore
  }
}
    `;
export const DriverPropertiesDocument = `
    query driverProperties($driverId: ID!) {
  driver: driverList(id: $driverId) {
    driverProperties {
      id
      displayName
      description
      category
      dataType
      defaultValue
      validValues
    }
    driverParameters
  }
}
    `;
export const GetDriverByIdDocument = `
    query getDriverById($driverId: ID!) {
  driverList(id: $driverId) {
    id
    name
    icon
  }
}
    `;
export const OpenConnectionDocument = `
    mutation openConnection($config: ConnectionConfig!) {
  openConnection(config: $config) {
    id
    name
    driverId
    connected
    features
  }
}
    `;
export const TestConnectionDocument = `
    mutation testConnection($config: ConnectionConfig!) {
  testConnection(config: $config) {
    id
  }
}
    `;
export const GetChildrenDbObjectInfoDocument = `
    query getChildrenDBObjectInfo($navNodeId: ID!, $filter: ObjectPropertyFilter) {
  dbObjects: navNodeChildren(parentPath: $navNodeId) {
    id
    object {
      features
      properties(filter: $filter) {
        id
        category
        dataType
        description
        displayName
        features
        value
      }
    }
  }
}
    `;
export const GetDbObjectInfoDocument = `
    query getDBObjectInfo($navNodeId: ID!, $filter: ObjectPropertyFilter) {
  objectInfo: navNodeInfo(nodePath: $navNodeId) {
    object {
      features
      properties(filter: $filter) {
        id
        category
        dataType
        description
        displayName
        features
        value
      }
    }
  }
}
    `;
export const NavNodeChildrenDocument = `
    query navNodeChildren($parentPath: ID!) {
  navNodeChildren(parentPath: $parentPath) {
    id
    name
    hasChildren
    nodeType
    icon
    folder
    inline
    navigable
    features
    object {
      features
    }
  }
  navNodeInfo(nodePath: $parentPath) {
    id
    name
    hasChildren
    nodeType
    icon
    folder
    inline
    navigable
    features
    object {
      features
    }
  }
}
    `;
export const NavNodeInfoDocument = `
    query navNodeInfo($nodePath: ID!) {
  navNodeInfo(nodePath: $nodePath) {
    id
    name
    hasChildren
    nodeType
    icon
    folder
    inline
    navigable
    features
    object {
      features
    }
  }
}
    `;
export const NavRefreshNodeDocument = `
    query navRefreshNode($nodePath: ID!) {
  navRefreshNode(nodePath: $nodePath)
}
    `;
export const ReadSessionLogDocument = `
    query readSessionLog($maxEntries: Int!, $clearEntries: Boolean!) {
  log: readSessionLog(maxEntries: $maxEntries, clearEntries: $clearEntries) {
    time
    type
    message
    stackTrace
  }
}
    `;
export const ChangeSessionLanguageDocument = `
    mutation changeSessionLanguage($locale: String!) {
  changeSessionLanguage(locale: $locale)
}
    `;
export const CreateUserDocument = `
    query createUser($userId: ID!) {
  user: createUser(userId: $userId) {
    userId
    grantedRoles
  }
}
    `;
export const DeleteUserDocument = `
    query deleteUser($userId: ID!) {
  deleteUser(userId: $userId)
}
    `;
export const GetPermissionsListDocument = `
    query getPermissionsList($roleId: ID) {
  permissions: listPermissions {
    id
    label
    description
    provider
    category
  }
}
    `;
export const GetRolesListDocument = `
    query getRolesList($roleId: ID) {
  roles: listRoles(roleId: $roleId) {
    roleId
    roleName
  }
}
    `;
export const GetUsersListDocument = `
    query getUsersList($userId: ID) {
  users: listUsers(userId: $userId) {
    userId
    grantedRoles
  }
}
    `;
export const GrantUserRoleDocument = `
    query grantUserRole($userId: ID!, $roleId: ID!) {
  grantUserRole(userId: $userId, roleId: $roleId)
}
    `;
export const SetUserCredentialsDocument = `
    query setUserCredentials($userId: ID!, $providerId: ID!, $credentials: Object!) {
  setUserCredentials(userId: $userId, providerId: $providerId, credentials: $credentials)
}
    `;
export const AuthLoginDocument = `
    query authLogin($provider: ID!, $credentials: Object!) {
  user: authLogin(provider: $provider, credentials: $credentials) {
    userId
    displayName
    authProvider
    loginTime
    message
  }
}
    `;
export const AuthLogoutDocument = `
    query authLogout {
  authLogout
}
    `;
export const GetAuthProvidersDocument = `
    query getAuthProviders {
  providers: authProviders {
    id
    label
    icon
    description
    defaultProvider
    credentialParameters {
      id
      displayName
      description
      admin
      user
      possibleValues
      encryption
    }
  }
}
    `;
export const GetSessionUserDocument = `
    query getSessionUser {
  user: sessionUser {
    userId
    displayName
    authProvider
    loginTime
    message
  }
}
    `;
export const AsyncExportTaskStatusDocument = `
    mutation asyncExportTaskStatus($taskId: String!) {
  taskInfo: asyncTaskStatus(id: $taskId) {
    id
    name
    running
    status
    error {
      message
      errorCode
      stackTrace
    }
    taskResult
  }
}
    `;
export const ExportDataFromContainerDocument = `
    query exportDataFromContainer($connectionId: ID!, $containerNodePath: ID!, $parameters: DataTransferParameters!) {
  taskInfo: dataTransferExportDataFromContainer(connectionId: $connectionId, containerNodePath: $containerNodePath, parameters: $parameters) {
    id
    running
    taskResult
    error {
      message
      errorCode
      stackTrace
    }
  }
}
    `;
export const ExportDataFromResultsDocument = `
    query exportDataFromResults($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $parameters: DataTransferParameters!) {
  taskInfo: dataTransferExportDataFromResults(connectionId: $connectionId, contextId: $contextId, resultsId: $resultsId, parameters: $parameters) {
    id
    running
    taskResult
    error {
      message
      errorCode
      stackTrace
    }
  }
}
    `;
export const GetDataTransferProcessorsDocument = `
    query getDataTransferProcessors {
  processors: dataTransferAvailableStreamProcessors {
    id
    name
    description
    fileExtension
    appFileExtension
    appName
    order
    icon
    properties {
      id
      displayName
      description
      category
      dataType
      defaultValue
      validValues
      features
    }
    isBinary
    isHTML
  }
}
    `;
export const RemoveDataTransferFileDocument = `
    query removeDataTransferFile($dataFileId: String!) {
  result: dataTransferRemoveDataFile(dataFileId: $dataFileId)
}
    `;
export const AsyncSqlExecuteQueryDocument = `
    mutation asyncSqlExecuteQuery($connectionId: ID!, $contextId: ID!, $query: String!, $filter: SQLDataFilter) {
  taskInfo: asyncSqlExecuteQuery(connectionId: $connectionId, contextId: $contextId, sql: $query, filter: $filter) {
    id
    running
    result {
      duration
      statusMessage
      results {
        updateRowCount
        sourceQuery
        title
        resultSet {
          id
          columns {
            dataKind
            entityName
            fullTypeName
            icon
            label
            maxLength
            name
            position
            precision
            scale
            typeName
          }
          rows
        }
      }
    }
    error {
      message
      errorCode
      stackTrace
    }
  }
}
    `;
export const AsyncTaskCancelDocument = `
    mutation asyncTaskCancel($taskId: String!) {
  result: asyncTaskCancel(id: $taskId)
}
    `;
export const AsyncTaskStatusDocument = `
    mutation asyncTaskStatus($taskId: String!) {
  taskInfo: asyncTaskStatus(id: $taskId) {
    id
    running
    result {
      duration
      statusMessage
      results {
        updateRowCount
        sourceQuery
        title
        resultSet {
          id
          columns {
            dataKind
            entityName
            fullTypeName
            icon
            label
            maxLength
            name
            position
            precision
            scale
            typeName
          }
          rows
        }
      }
    }
    error {
      message
      errorCode
      stackTrace
    }
  }
}
    `;
export const ExecuteSqlQueryDocument = `
    mutation executeSqlQuery($connectionId: ID!, $contextId: ID!, $query: String!, $filter: SQLDataFilter) {
  result: sqlExecuteQuery(connectionId: $connectionId, contextId: $contextId, sql: $query, filter: $filter) {
    duration
    statusMessage
    results {
      updateRowCount
      sourceQuery
      title
      resultSet {
        id
        columns {
          dataKind
          entityName
          fullTypeName
          icon
          label
          maxLength
          name
          position
          precision
          scale
          typeName
        }
        rows
      }
    }
  }
}
    `;
export const MetadataGetNodeDdlDocument = `
    query metadataGetNodeDDL($nodeId: ID!) {
  metadataGetNodeDDL(nodeId: $nodeId)
}
    `;
export const QuerySqlCompletionProposalsDocument = `
    query querySqlCompletionProposals($connectionId: ID!, $contextId: ID!, $position: Int!, $query: String!, $maxResults: Int) {
  sqlCompletionProposals(connectionId: $connectionId, contextId: $contextId, maxResults: $maxResults, position: $position, query: $query) {
    cursorPosition
    displayString
    icon
    nodePath
    replacementLength
    replacementOffset
    replacementString
    score
    type
  }
}
    `;
export const QuerySqlDialectInfoDocument = `
    query querySqlDialectInfo($connectionId: ID!) {
  dialect: sqlDialectInfo(connectionId: $connectionId) {
    name
    dataTypes
    functions
    reservedWords
    quoteStrings
    singleLineComments
    multiLineComments
    catalogSeparator
    structSeparator
    scriptDelimiter
  }
}
    `;
export const ReadDataFromContainerDocument = `
    mutation readDataFromContainer($connectionId: ID!, $contextId: ID!, $containerNodePath: ID!, $filter: SQLDataFilter) {
  readDataFromContainer(connectionId: $connectionId, contextId: $contextId, containerNodePath: $containerNodePath, filter: $filter) {
    duration
    statusMessage
    results {
      updateRowCount
      sourceQuery
      title
      resultSet {
        id
        columns {
          dataKind
          entityName
          fullTypeName
          icon
          label
          maxLength
          name
          position
          precision
          scale
          typeName
        }
        rows
      }
    }
  }
}
    `;
export const SqlContextCreateDocument = `
    mutation sqlContextCreate($connectionId: ID!, $defaultCatalog: String, $defaultSchema: String) {
  context: sqlContextCreate(connectionId: $connectionId, defaultCatalog: $defaultCatalog, defaultSchema: $defaultSchema) {
    id
    defaultCatalog
    defaultSchema
  }
}
    `;
export const SqlContextDestroyDocument = `
    mutation sqlContextDestroy($connectionId: ID!, $contextId: ID!) {
  sqlContextDestroy(connectionId: $connectionId, contextId: $contextId)
}
    `;
export const SqlContextSetDefaultsDocument = `
    mutation sqlContextSetDefaults($connectionId: ID!, $contextId: ID!, $defaultCatalog: ID, $defaultSchema: ID) {
  context: sqlContextSetDefaults(connectionId: $connectionId, contextId: $contextId, defaultCatalog: $defaultCatalog, defaultSchema: $defaultSchema)
}
    `;
export const SqlResultCloseDocument = `
    mutation sqlResultClose($connectionId: ID!, $contextId: ID!, $resultId: ID!) {
  result: sqlResultClose(connectionId: $connectionId, contextId: $contextId, resultId: $resultId)
}
    `;
export const UpdateResultsDataDocument = `
    mutation updateResultsData($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $sourceRowValues: [Object]!, $values: Object) {
  result: updateResultsData(connectionId: $connectionId, contextId: $contextId, resultsId: $resultsId, updateRow: $sourceRowValues, updateValues: $values) {
    duration
    results {
      updateRowCount
      resultSet {
        id
        rows
      }
    }
  }
}
    `;
export const OpenSessionDocument = `
    mutation openSession {
  session: openSession {
    createTime
    lastAccessTime
    cacheExpired
    locale
    connections {
      id
      name
      driverId
      connected
      features
    }
  }
}
    `;
export const ServerConfigDocument = `
    query serverConfig {
  serverConfig {
    name
    version
    productConfiguration
    supportsPredefinedConnections
    supportsProvidedConnections
    supportsCustomConnections
    supportsConnectionBrowser
    supportsWorkspaces
    anonymousAccessEnabled
    authenticationEnabled
    supportedLanguages {
      isoCode
      displayName
      nativeName
    }
    productConfiguration
  }
}
    `;
export const SessionPermissionsDocument = `
    query sessionPermissions {
  permissions: sessionPermissions
}
    `;
export const SessionStateDocument = `
    query sessionState {
  sessionState {
    createTime
    lastAccessTime
    locale
    cacheExpired
    connections {
      id
      name
      driverId
      connected
      features
    }
  }
}
    `;
export const TouchSessionDocument = `
    mutation touchSession {
  touchSession
}
    `;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    navGetStructContainers(variables: NavGetStructContainersQueryVariables): Promise<NavGetStructContainersQuery> {
      return withWrapper(() => client.request<NavGetStructContainersQuery>(NavGetStructContainersDocument, variables));
    },
    closeConnection(variables: CloseConnectionMutationVariables): Promise<CloseConnectionMutation> {
      return withWrapper(() => client.request<CloseConnectionMutation>(CloseConnectionDocument, variables));
    },
    connectionState(variables: ConnectionStateQueryVariables): Promise<ConnectionStateQuery> {
      return withWrapper(() => client.request<ConnectionStateQuery>(ConnectionStateDocument, variables));
    },
    createConnection(variables: CreateConnectionMutationVariables): Promise<CreateConnectionMutation> {
      return withWrapper(() => client.request<CreateConnectionMutation>(CreateConnectionDocument, variables));
    },
    dataSourceList(variables?: DataSourceListQueryVariables): Promise<DataSourceListQuery> {
      return withWrapper(() => client.request<DataSourceListQuery>(DataSourceListDocument, variables));
    },
    driverList(variables?: DriverListQueryVariables): Promise<DriverListQuery> {
      return withWrapper(() => client.request<DriverListQuery>(DriverListDocument, variables));
    },
    driverProperties(variables: DriverPropertiesQueryVariables): Promise<DriverPropertiesQuery> {
      return withWrapper(() => client.request<DriverPropertiesQuery>(DriverPropertiesDocument, variables));
    },
    getDriverById(variables: GetDriverByIdQueryVariables): Promise<GetDriverByIdQuery> {
      return withWrapper(() => client.request<GetDriverByIdQuery>(GetDriverByIdDocument, variables));
    },
    openConnection(variables: OpenConnectionMutationVariables): Promise<OpenConnectionMutation> {
      return withWrapper(() => client.request<OpenConnectionMutation>(OpenConnectionDocument, variables));
    },
    testConnection(variables: TestConnectionMutationVariables): Promise<TestConnectionMutation> {
      return withWrapper(() => client.request<TestConnectionMutation>(TestConnectionDocument, variables));
    },
    getChildrenDBObjectInfo(variables: GetChildrenDbObjectInfoQueryVariables): Promise<GetChildrenDbObjectInfoQuery> {
      return withWrapper(() => client.request<GetChildrenDbObjectInfoQuery>(GetChildrenDbObjectInfoDocument, variables));
    },
    getDBObjectInfo(variables: GetDbObjectInfoQueryVariables): Promise<GetDbObjectInfoQuery> {
      return withWrapper(() => client.request<GetDbObjectInfoQuery>(GetDbObjectInfoDocument, variables));
    },
    navNodeChildren(variables: NavNodeChildrenQueryVariables): Promise<NavNodeChildrenQuery> {
      return withWrapper(() => client.request<NavNodeChildrenQuery>(NavNodeChildrenDocument, variables));
    },
    navNodeInfo(variables: NavNodeInfoQueryVariables): Promise<NavNodeInfoQuery> {
      return withWrapper(() => client.request<NavNodeInfoQuery>(NavNodeInfoDocument, variables));
    },
    navRefreshNode(variables: NavRefreshNodeQueryVariables): Promise<NavRefreshNodeQuery> {
      return withWrapper(() => client.request<NavRefreshNodeQuery>(NavRefreshNodeDocument, variables));
    },
    readSessionLog(variables: ReadSessionLogQueryVariables): Promise<ReadSessionLogQuery> {
      return withWrapper(() => client.request<ReadSessionLogQuery>(ReadSessionLogDocument, variables));
    },
    changeSessionLanguage(variables: ChangeSessionLanguageMutationVariables): Promise<ChangeSessionLanguageMutation> {
      return withWrapper(() => client.request<ChangeSessionLanguageMutation>(ChangeSessionLanguageDocument, variables));
    },
    createUser(variables: CreateUserQueryVariables): Promise<CreateUserQuery> {
      return withWrapper(() => client.request<CreateUserQuery>(CreateUserDocument, variables));
    },
    deleteUser(variables: DeleteUserQueryVariables): Promise<DeleteUserQuery> {
      return withWrapper(() => client.request<DeleteUserQuery>(DeleteUserDocument, variables));
    },
    getPermissionsList(variables?: GetPermissionsListQueryVariables): Promise<GetPermissionsListQuery> {
      return withWrapper(() => client.request<GetPermissionsListQuery>(GetPermissionsListDocument, variables));
    },
    getRolesList(variables?: GetRolesListQueryVariables): Promise<GetRolesListQuery> {
      return withWrapper(() => client.request<GetRolesListQuery>(GetRolesListDocument, variables));
    },
    getUsersList(variables?: GetUsersListQueryVariables): Promise<GetUsersListQuery> {
      return withWrapper(() => client.request<GetUsersListQuery>(GetUsersListDocument, variables));
    },
    grantUserRole(variables: GrantUserRoleQueryVariables): Promise<GrantUserRoleQuery> {
      return withWrapper(() => client.request<GrantUserRoleQuery>(GrantUserRoleDocument, variables));
    },
    setUserCredentials(variables: SetUserCredentialsQueryVariables): Promise<SetUserCredentialsQuery> {
      return withWrapper(() => client.request<SetUserCredentialsQuery>(SetUserCredentialsDocument, variables));
    },
    authLogin(variables: AuthLoginQueryVariables): Promise<AuthLoginQuery> {
      return withWrapper(() => client.request<AuthLoginQuery>(AuthLoginDocument, variables));
    },
    authLogout(variables?: AuthLogoutQueryVariables): Promise<AuthLogoutQuery> {
      return withWrapper(() => client.request<AuthLogoutQuery>(AuthLogoutDocument, variables));
    },
    getAuthProviders(variables?: GetAuthProvidersQueryVariables): Promise<GetAuthProvidersQuery> {
      return withWrapper(() => client.request<GetAuthProvidersQuery>(GetAuthProvidersDocument, variables));
    },
    getSessionUser(variables?: GetSessionUserQueryVariables): Promise<GetSessionUserQuery> {
      return withWrapper(() => client.request<GetSessionUserQuery>(GetSessionUserDocument, variables));
    },
    asyncExportTaskStatus(variables: AsyncExportTaskStatusMutationVariables): Promise<AsyncExportTaskStatusMutation> {
      return withWrapper(() => client.request<AsyncExportTaskStatusMutation>(AsyncExportTaskStatusDocument, variables));
    },
    exportDataFromContainer(variables: ExportDataFromContainerQueryVariables): Promise<ExportDataFromContainerQuery> {
      return withWrapper(() => client.request<ExportDataFromContainerQuery>(ExportDataFromContainerDocument, variables));
    },
    exportDataFromResults(variables: ExportDataFromResultsQueryVariables): Promise<ExportDataFromResultsQuery> {
      return withWrapper(() => client.request<ExportDataFromResultsQuery>(ExportDataFromResultsDocument, variables));
    },
    getDataTransferProcessors(variables?: GetDataTransferProcessorsQueryVariables): Promise<GetDataTransferProcessorsQuery> {
      return withWrapper(() => client.request<GetDataTransferProcessorsQuery>(GetDataTransferProcessorsDocument, variables));
    },
    removeDataTransferFile(variables: RemoveDataTransferFileQueryVariables): Promise<RemoveDataTransferFileQuery> {
      return withWrapper(() => client.request<RemoveDataTransferFileQuery>(RemoveDataTransferFileDocument, variables));
    },
    asyncSqlExecuteQuery(variables: AsyncSqlExecuteQueryMutationVariables): Promise<AsyncSqlExecuteQueryMutation> {
      return withWrapper(() => client.request<AsyncSqlExecuteQueryMutation>(AsyncSqlExecuteQueryDocument, variables));
    },
    asyncTaskCancel(variables: AsyncTaskCancelMutationVariables): Promise<AsyncTaskCancelMutation> {
      return withWrapper(() => client.request<AsyncTaskCancelMutation>(AsyncTaskCancelDocument, variables));
    },
    asyncTaskStatus(variables: AsyncTaskStatusMutationVariables): Promise<AsyncTaskStatusMutation> {
      return withWrapper(() => client.request<AsyncTaskStatusMutation>(AsyncTaskStatusDocument, variables));
    },
    executeSqlQuery(variables: ExecuteSqlQueryMutationVariables): Promise<ExecuteSqlQueryMutation> {
      return withWrapper(() => client.request<ExecuteSqlQueryMutation>(ExecuteSqlQueryDocument, variables));
    },
    metadataGetNodeDDL(variables: MetadataGetNodeDdlQueryVariables): Promise<MetadataGetNodeDdlQuery> {
      return withWrapper(() => client.request<MetadataGetNodeDdlQuery>(MetadataGetNodeDdlDocument, variables));
    },
    querySqlCompletionProposals(variables: QuerySqlCompletionProposalsQueryVariables): Promise<QuerySqlCompletionProposalsQuery> {
      return withWrapper(() => client.request<QuerySqlCompletionProposalsQuery>(QuerySqlCompletionProposalsDocument, variables));
    },
    querySqlDialectInfo(variables: QuerySqlDialectInfoQueryVariables): Promise<QuerySqlDialectInfoQuery> {
      return withWrapper(() => client.request<QuerySqlDialectInfoQuery>(QuerySqlDialectInfoDocument, variables));
    },
    readDataFromContainer(variables: ReadDataFromContainerMutationVariables): Promise<ReadDataFromContainerMutation> {
      return withWrapper(() => client.request<ReadDataFromContainerMutation>(ReadDataFromContainerDocument, variables));
    },
    sqlContextCreate(variables: SqlContextCreateMutationVariables): Promise<SqlContextCreateMutation> {
      return withWrapper(() => client.request<SqlContextCreateMutation>(SqlContextCreateDocument, variables));
    },
    sqlContextDestroy(variables: SqlContextDestroyMutationVariables): Promise<SqlContextDestroyMutation> {
      return withWrapper(() => client.request<SqlContextDestroyMutation>(SqlContextDestroyDocument, variables));
    },
    sqlContextSetDefaults(variables: SqlContextSetDefaultsMutationVariables): Promise<SqlContextSetDefaultsMutation> {
      return withWrapper(() => client.request<SqlContextSetDefaultsMutation>(SqlContextSetDefaultsDocument, variables));
    },
    sqlResultClose(variables: SqlResultCloseMutationVariables): Promise<SqlResultCloseMutation> {
      return withWrapper(() => client.request<SqlResultCloseMutation>(SqlResultCloseDocument, variables));
    },
    updateResultsData(variables: UpdateResultsDataMutationVariables): Promise<UpdateResultsDataMutation> {
      return withWrapper(() => client.request<UpdateResultsDataMutation>(UpdateResultsDataDocument, variables));
    },
    openSession(variables?: OpenSessionMutationVariables): Promise<OpenSessionMutation> {
      return withWrapper(() => client.request<OpenSessionMutation>(OpenSessionDocument, variables));
    },
    serverConfig(variables?: ServerConfigQueryVariables): Promise<ServerConfigQuery> {
      return withWrapper(() => client.request<ServerConfigQuery>(ServerConfigDocument, variables));
    },
    sessionPermissions(variables?: SessionPermissionsQueryVariables): Promise<SessionPermissionsQuery> {
      return withWrapper(() => client.request<SessionPermissionsQuery>(SessionPermissionsDocument, variables));
    },
    sessionState(variables?: SessionStateQueryVariables): Promise<SessionStateQuery> {
      return withWrapper(() => client.request<SessionStateQuery>(SessionStateDocument, variables));
    },
    touchSession(variables?: TouchSessionMutationVariables): Promise<TouchSessionMutation> {
      return withWrapper(() => client.request<TouchSessionMutation>(TouchSessionDocument, variables));
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
