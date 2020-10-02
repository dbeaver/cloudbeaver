/* eslint-disable max-len */
import { GraphQLClient } from 'graphql-request';

export type Maybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
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

export type Query = {
  allConnections: Array<ConnectionInfo>;
  authLogin: UserAuthInfo;
  authLogout?: Maybe<Scalars['Boolean']>;
  authModels: Array<DatabaseAuthModel>;
  authProviders: Array<AuthProviderInfo>;
  configureServer: Scalars['Boolean'];
  connectionInfo: ConnectionInfo;
  /** @deprecated Field no longer supported */
  connectionState: ConnectionInfo;
  createConnectionConfiguration: ConnectionInfo;
  createRole: AdminRoleInfo;
  createUser: AdminUserInfo;
  dataTransferAvailableStreamProcessors: Array<DataTransferProcessorInfo>;
  dataTransferExportDataFromContainer: AsyncTaskInfo;
  dataTransferExportDataFromResults: AsyncTaskInfo;
  dataTransferRemoveDataFile?: Maybe<Scalars['Boolean']>;
  deleteConnectionConfiguration?: Maybe<Scalars['Boolean']>;
  deleteRole?: Maybe<Scalars['Boolean']>;
  deleteUser?: Maybe<Scalars['Boolean']>;
  driverList: Array<DriverInfo>;
  getConnectionSubjectAccess: Array<AdminConnectionGrantInfo>;
  getSubjectConnectionAccess: Array<AdminConnectionGrantInfo>;
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
  searchConnections: Array<AdminConnectionSearchInfo>;
  serverConfig: ServerConfig;
  sessionPermissions: Array<Maybe<Scalars['ID']>>;
  sessionState: SessionInfo;
  sessionUser?: Maybe<UserAuthInfo>;
  setConnectionSubjectAccess?: Maybe<Scalars['Boolean']>;
  setDefaultNavigatorSettings: Scalars['Boolean'];
  setSubjectConnectionAccess?: Maybe<Scalars['Boolean']>;
  setSubjectPermissions?: Maybe<Scalars['Boolean']>;
  setUserCredentials?: Maybe<Scalars['Boolean']>;
  sqlCompletionProposals?: Maybe<Array<Maybe<SqlCompletionProposal>>>;
  sqlDialectInfo?: Maybe<SqlDialectInfo>;
  sqlListContexts?: Maybe<Array<Maybe<SqlContextInfo>>>;
  templateConnections: Array<ConnectionInfo>;
  updateConnectionConfiguration: ConnectionInfo;
};

export type QueryAuthLoginArgs = {
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
};

export type QueryConfigureServerArgs = {
  configuration: ServerConfigInput;
};

export type QueryConnectionInfoArgs = {
  id: Scalars['ID'];
};

export type QueryConnectionStateArgs = {
  id: Scalars['ID'];
};

export type QueryCreateConnectionConfigurationArgs = {
  config: ConnectionConfig;
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

export type QueryDeleteConnectionConfigurationArgs = {
  id: Scalars['ID'];
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

export type QueryGetConnectionSubjectAccessArgs = {
  connectionId?: Maybe<Scalars['ID']>;
};

export type QueryGetSubjectConnectionAccessArgs = {
  subjectId?: Maybe<Scalars['ID']>;
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

export type QuerySearchConnectionsArgs = {
  hostNames: Array<Scalars['String']>;
};

export type QuerySetConnectionSubjectAccessArgs = {
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']>;
};

export type QuerySetDefaultNavigatorSettingsArgs = {
  settings: NavigatorSettingsInput;
};

export type QuerySetSubjectConnectionAccessArgs = {
  subjectId: Scalars['ID'];
  connections: Array<Scalars['ID']>;
};

export type QuerySetSubjectPermissionsArgs = {
  roleId: Scalars['ID'];
  permissions: Array<Scalars['ID']>;
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

export type QueryUpdateConnectionConfigurationArgs = {
  id: Scalars['ID'];
  config: ConnectionConfig;
};

export type Mutation = {
  asyncSqlExecuteQuery: AsyncTaskInfo;
  asyncSqlExecuteResults: SqlExecuteInfo;
  asyncTaskCancel?: Maybe<Scalars['Boolean']>;
  asyncTaskInfo: AsyncTaskInfo;
  /** @deprecated Field no longer supported */
  asyncTaskStatus: AsyncTaskInfo;
  changeSessionLanguage?: Maybe<Scalars['Boolean']>;
  closeConnection: ConnectionInfo;
  closeSession?: Maybe<Scalars['Boolean']>;
  createConnection: ConnectionInfo;
  createConnectionFromTemplate: ConnectionInfo;
  deleteConnection: Scalars['Boolean'];
  initConnection: ConnectionInfo;
  /** @deprecated Field no longer supported */
  openConnection: ConnectionInfo;
  openSession: SessionInfo;
  readDataFromContainer?: Maybe<SqlExecuteInfo>;
  refreshSessionConnections?: Maybe<Scalars['Boolean']>;
  setConnectionNavigatorSettings: Scalars['Boolean'];
  sqlContextCreate: SqlContextInfo;
  sqlContextDestroy: Scalars['Boolean'];
  sqlContextSetDefaults: Scalars['Boolean'];
  sqlExecuteQuery?: Maybe<SqlExecuteInfo>;
  sqlResultClose: Scalars['Boolean'];
  testConnection: ConnectionInfo;
  touchSession?: Maybe<Scalars['Boolean']>;
  updateResultsData?: Maybe<SqlExecuteInfo>;
  updateResultsDataBatch?: Maybe<SqlExecuteInfo>;
};

export type MutationAsyncSqlExecuteQueryArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  sql: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
};

export type MutationAsyncSqlExecuteResultsArgs = {
  taskId: Scalars['ID'];
};

export type MutationAsyncTaskCancelArgs = {
  id: Scalars['String'];
};

export type MutationAsyncTaskInfoArgs = {
  id: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
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

export type MutationCreateConnectionFromTemplateArgs = {
  templateId: Scalars['ID'];
};

export type MutationDeleteConnectionArgs = {
  id: Scalars['ID'];
};

export type MutationInitConnectionArgs = {
  id: Scalars['ID'];
  credentials?: Maybe<Scalars['Object']>;
};

export type MutationOpenConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationReadDataFromContainerArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
};

export type MutationSetConnectionNavigatorSettingsArgs = {
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
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
  dataFormat?: Maybe<ResultDataFormat>;
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

export type MutationUpdateResultsDataBatchArgs = {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<Array<SqlResultRow>>;
  deletedRows?: Maybe<Array<SqlResultRow>>;
  addedRows?: Maybe<Array<SqlResultRow>>;
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

export type AsyncTaskInfo = {
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  running: Scalars['Boolean'];
  status?: Maybe<Scalars['String']>;
  error?: Maybe<ServerError>;
  /** @deprecated Field no longer supported */
  result?: Maybe<SqlExecuteInfo>;
  taskResult?: Maybe<Scalars['Object']>;
};

export type ServerError = {
  message?: Maybe<Scalars['String']>;
  errorCode?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
  causedBy?: Maybe<ServerError>;
};

export type ServerMessage = {
  time?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
};

export type ServerLanguage = {
  isoCode: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  nativeName?: Maybe<Scalars['String']>;
};

export type WebServiceConfig = {
  id: Scalars['String'];
  name: Scalars['String'];
  description: Scalars['String'];
  bundleVersion: Scalars['String'];
};

export type ServerConfig = {
  name: Scalars['String'];
  version: Scalars['String'];
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  supportsCustomConnections?: Maybe<Scalars['Boolean']>;
  supportsConnectionBrowser?: Maybe<Scalars['Boolean']>;
  supportsWorkspaces?: Maybe<Scalars['Boolean']>;
  configurationMode?: Maybe<Scalars['Boolean']>;
  developmentMode?: Maybe<Scalars['Boolean']>;
  supportedLanguages: Array<ServerLanguage>;
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  productConfiguration: Scalars['Object'];
  defaultNavigatorSettings: NavigatorSettings;
};

export type SessionInfo = {
  createTime: Scalars['String'];
  lastAccessTime: Scalars['String'];
  locale: Scalars['String'];
  cacheExpired: Scalars['Boolean'];
  serverMessages?: Maybe<Array<Maybe<ServerMessage>>>;
  connections: Array<ConnectionInfo>;
};

export type DatabaseAuthModel = {
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  properties: Array<ObjectPropertyInfo>;
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
  defaultDatabase?: Maybe<Scalars['String']>;
  defaultServer?: Maybe<Scalars['String']>;
  defaultUser?: Maybe<Scalars['String']>;
  sampleURL?: Maybe<Scalars['String']>;
  driverInfoURL?: Maybe<Scalars['String']>;
  driverPropertiesURL?: Maybe<Scalars['String']>;
  embedded?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  allowsEmptyPassword?: Maybe<Scalars['Boolean']>;
  licenseRequired?: Maybe<Scalars['Boolean']>;
  license?: Maybe<Scalars['String']>;
  custom?: Maybe<Scalars['Boolean']>;
  promotedScore?: Maybe<Scalars['Int']>;
  connectionProperties?: Maybe<Scalars['Object']>;
  defaultConnectionProperties?: Maybe<Scalars['Object']>;
  driverProperties?: Maybe<Array<ObjectPropertyInfo>>;
  driverParameters?: Maybe<Scalars['Object']>;
  anonymousAccess?: Maybe<Scalars['Boolean']>;
  defaultAuthModel: Scalars['ID'];
  applicableAuthModel: Array<Scalars['ID']>;
};

export enum ResultDataFormat {
  Resultset = 'resultset',
  Document = 'document',
  Graph = 'graph',
  Timeseries = 'timeseries'
}

export type ConnectionInfo = {
  id: Scalars['ID'];
  driverId: Scalars['ID'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['String']>;
  databaseName?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  template: Scalars['Boolean'];
  connected: Scalars['Boolean'];
  provided: Scalars['Boolean'];
  readOnly: Scalars['Boolean'];
  connectTime?: Maybe<Scalars['String']>;
  connectionError?: Maybe<ServerError>;
  serverVersion?: Maybe<Scalars['String']>;
  clientVersion?: Maybe<Scalars['String']>;
  authNeeded: Scalars['Boolean'];
  authModel?: Maybe<Scalars['ID']>;
  authProperties: Array<ObjectPropertyInfo>;
  features: Array<Scalars['String']>;
  navigatorSettings: NavigatorSettings;
  supportedDataFormats: Array<ResultDataFormat>;
};

export type ConnectionConfig = {
  connectionId?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  templateId?: Maybe<Scalars['ID']>;
  driverId?: Maybe<Scalars['ID']>;
  host?: Maybe<Scalars['String']>;
  port?: Maybe<Scalars['String']>;
  databaseName?: Maybe<Scalars['String']>;
  url?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  template?: Maybe<Scalars['Boolean']>;
  readOnly?: Maybe<Scalars['Boolean']>;
  saveCredentials?: Maybe<Scalars['Boolean']>;
  authModelId?: Maybe<Scalars['ID']>;
  credentials?: Maybe<Scalars['Object']>;
  dataSourceId?: Maybe<Scalars['ID']>;
  userName?: Maybe<Scalars['String']>;
  userPassword?: Maybe<Scalars['String']>;
};

export type NavigatorSettings = {
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
};

export type NavigatorSettingsInput = {
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
};

export type LogEntry = {
  time?: Maybe<Scalars['DateTime']>;
  type: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
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

export type DatabaseStructContainers = {
  catalogList: Array<DatabaseObjectInfo>;
  schemaList: Array<DatabaseObjectInfo>;
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

export type SqlDataFilterConstraint = {
  attribute: Scalars['String'];
  orderPosition?: Maybe<Scalars['Int']>;
  orderAsc?: Maybe<Scalars['Boolean']>;
  criteria?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
};

export type SqlDataFilter = {
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  constraints?: Maybe<Array<Maybe<SqlDataFilterConstraint>>>;
  where?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Scalars['String']>;
};

export type SqlResultColumn = {
  position: Scalars['Int'];
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
  readOnly: Scalars['Boolean'];
  readOnlyStatus?: Maybe<Scalars['String']>;
};

export type DatabaseDocument = {
  id?: Maybe<Scalars['String']>;
  contentType?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  data?: Maybe<Scalars['Object']>;
};

export type SqlResultSet = {
  id: Scalars['ID'];
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars['Object']>>>>>;
  hasMoreData?: Maybe<Scalars['Boolean']>;
};

export type SqlQueryResults = {
  title?: Maybe<Scalars['String']>;
  updateRowCount?: Maybe<Scalars['Int']>;
  sourceQuery?: Maybe<Scalars['String']>;
  dataFormat?: Maybe<ResultDataFormat>;
  resultSet?: Maybe<SqlResultSet>;
};

export type SqlExecuteInfo = {
  statusMessage?: Maybe<Scalars['String']>;
  duration?: Maybe<Scalars['Int']>;
  results: Array<SqlQueryResults>;
};

export type SqlResultRow = {
  data: Array<Maybe<Scalars['Object']>>;
  updateValues?: Maybe<Scalars['Object']>;
};

export enum AdminSubjectType {
  User = 'user',
  Role = 'role'
}

export type AdminConnectionGrantInfo = {
  connectionId: Scalars['ID'];
  subjectId: Scalars['ID'];
  subjectType: AdminSubjectType;
};

export type AdminConnectionSearchInfo = {
  host: Scalars['String'];
  port: Scalars['Int'];
  possibleDrivers: Array<Scalars['ID']>;
  defaultDriver: Scalars['ID'];
};

export type AdminUserInfo = {
  userId: Scalars['ID'];
  metaParameters: Scalars['Object'];
  configurationParameters: Scalars['Object'];
  grantedRoles: Array<Scalars['ID']>;
  grantedConnections: Array<AdminConnectionGrantInfo>;
};

export type AdminRoleInfo = {
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  rolePermissions: Array<Maybe<Scalars['ID']>>;
};

export type AdminPermissionInfo = {
  id: Scalars['ID'];
  label?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  provider: Scalars['String'];
  category?: Maybe<Scalars['String']>;
};

export type ServerConfigInput = {
  serverName?: Maybe<Scalars['String']>;
  adminName?: Maybe<Scalars['String']>;
  adminPassword?: Maybe<Scalars['String']>;
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  customConnectionsEnabled?: Maybe<Scalars['Boolean']>;
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

export type UserAuthInfo = {
  userId: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  authProvider: Scalars['String'];
  loginTime: Scalars['DateTime'];
  message?: Maybe<Scalars['String']>;
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

export type DataTransferParameters = {
  processorId: Scalars['ID'];
  settings?: Maybe<Scalars['Object']>;
  processorProperties: Scalars['Object'];
  filter?: Maybe<SqlDataFilter>;
};

export type AsyncTaskCancelMutationVariables = Exact<{
  taskId: Scalars['String'];
}>;

export type AsyncTaskCancelMutation = { result: Mutation['asyncTaskCancel'] };

export type AuthLoginQueryVariables = Exact<{
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
}>;

export type AuthLoginQuery = { user: Pick<UserAuthInfo, 'userId' | 'displayName' | 'authProvider' | 'loginTime' | 'message'> };

export type AuthLogoutQueryVariables = Exact<{ [key: string]: never; }>;

export type AuthLogoutQuery = Pick<Query, 'authLogout'>;

export type GetAuthProvidersQueryVariables = Exact<{ [key: string]: never; }>;

export type GetAuthProvidersQuery = { providers: Array<(
    Pick<AuthProviderInfo, 'id' | 'label' | 'icon' | 'description' | 'defaultProvider'>
    & { credentialParameters: Array<Pick<AuthCredentialInfo, 'id' | 'displayName' | 'description' | 'admin' | 'user' | 'possibleValues' | 'encryption'>> }
  )> };

export type GetSessionUserQueryVariables = Exact<{ [key: string]: never; }>;

export type GetSessionUserQuery = { user?: Maybe<Pick<UserAuthInfo, 'userId' | 'displayName' | 'authProvider' | 'loginTime' | 'message'>> };

export type CreateUserQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;

export type CreateUserQuery = { user: Pick<AdminUserInfo, 'userId' | 'grantedRoles'> };

export type DeleteUserQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;

export type DeleteUserQuery = Pick<Query, 'deleteUser'>;

export type GetPermissionsListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export type GetPermissionsListQuery = { permissions: Array<Maybe<Pick<AdminPermissionInfo, 'id' | 'label' | 'description' | 'provider' | 'category'>>> };

export type GetRolesListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export type GetRolesListQuery = { roles: Array<Maybe<Pick<AdminRoleInfo, 'roleId' | 'roleName'>>> };

export type GetUserGrantedConnectionsQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
}>;

export type GetUserGrantedConnectionsQuery = { grantedConnections: Array<Pick<AdminConnectionGrantInfo, 'connectionId' | 'subjectId' | 'subjectType'>> };

export type GetUsersListQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
}>;

export type GetUsersListQuery = { users: Array<Maybe<Pick<AdminUserInfo, 'userId' | 'grantedRoles'>>> };

export type GrantUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;

export type GrantUserRoleQuery = Pick<Query, 'grantUserRole'>;

export type RevokeUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;

export type RevokeUserRoleQuery = Pick<Query, 'revokeUserRole'>;

export type SetConnectionsQueryVariables = Exact<{
  userId: Scalars['ID'];
  connections: Array<Scalars['ID']>;
}>;

export type SetConnectionsQuery = { grantedConnections: Query['setSubjectConnectionAccess'] };

export type SetUserCredentialsQueryVariables = Exact<{
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
}>;

export type SetUserCredentialsQuery = Pick<Query, 'setUserCredentials'>;

export type CreateConnectionConfigurationQueryVariables = Exact<{
  config: ConnectionConfig;
}>;

export type CreateConnectionConfigurationQuery = { connection: (
    Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'template' | 'connected' | 'readOnly' | 'host' | 'port' | 'databaseName' | 'url' | 'properties' | 'features' | 'authNeeded' | 'authModel'>
    & { authProperties: Array<Pick<ObjectPropertyInfo, 'id' | 'value' | 'features'>> }
  ) };

export type DeleteConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type DeleteConnectionConfigurationQuery = Pick<Query, 'deleteConnectionConfiguration'>;

export type GetConnectionAccessQueryVariables = Exact<{
  connectionId?: Maybe<Scalars['ID']>;
}>;

export type GetConnectionAccessQuery = { subjects: Array<Pick<AdminConnectionGrantInfo, 'connectionId' | 'subjectId' | 'subjectType'>> };

export type GetConnectionsQueryVariables = Exact<{ [key: string]: never; }>;

export type GetConnectionsQuery = { connections: Array<(
    Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'template' | 'connected' | 'readOnly' | 'host' | 'port' | 'databaseName' | 'url' | 'properties' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'>
    & { authProperties: Array<Pick<ObjectPropertyInfo, 'id' | 'value' | 'features'>> }
  )> };

export type SearchDatabasesQueryVariables = Exact<{
  hosts: Array<Scalars['String']>;
}>;

export type SearchDatabasesQuery = { databases: Array<Pick<AdminConnectionSearchInfo, 'host' | 'port' | 'possibleDrivers' | 'defaultDriver'>> };

export type SetConnectionAccessQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']>;
}>;

export type SetConnectionAccessQuery = Pick<Query, 'setConnectionSubjectAccess'>;

export type UpdateConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
  config: ConnectionConfig;
}>;

export type UpdateConnectionConfigurationQuery = { connection: (
    Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'template' | 'connected' | 'readOnly' | 'host' | 'port' | 'databaseName' | 'url' | 'properties' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'>
    & { authProperties: Array<Pick<ObjectPropertyInfo, 'id' | 'value' | 'features'>> }
  ) };

export type CloseConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;

export type CloseConnectionMutation = { connection: Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'> };

export type ConnectionAuthPropertiesQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type ConnectionAuthPropertiesQuery = { connection: { authProperties: Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'value' | 'validValues' | 'defaultValue' | 'features'>> } };

export type ConnectionInfoQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type ConnectionInfoQuery = { connection: Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'> };

export type CreateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
}>;

export type CreateConnectionMutation = { createConnection: Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'> };

export type CreateConnectionFromTemplateMutationVariables = Exact<{
  templateId: Scalars['ID'];
}>;

export type CreateConnectionFromTemplateMutation = { connection: Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'> };

export type DeleteConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;

export type DeleteConnectionMutation = Pick<Mutation, 'deleteConnection'>;

export type DriverListQueryVariables = Exact<{ [key: string]: never; }>;

export type DriverListQuery = { driverList: Array<Pick<DriverInfo, 'id' | 'name' | 'icon' | 'description' | 'defaultPort' | 'defaultDatabase' | 'defaultServer' | 'defaultUser' | 'sampleURL' | 'embedded' | 'anonymousAccess' | 'promotedScore' | 'defaultAuthModel'>> };

export type DriverPropertiesQueryVariables = Exact<{
  driverId: Scalars['ID'];
}>;

export type DriverPropertiesQuery = { driver: Array<(
    Pick<DriverInfo, 'driverParameters'>
    & { driverProperties?: Maybe<Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues'>>> }
  )> };

export type GetAuthModelsQueryVariables = Exact<{ [key: string]: never; }>;

export type GetAuthModelsQuery = { models: Array<(
    Pick<DatabaseAuthModel, 'id' | 'displayName' | 'description' | 'icon'>
    & { properties: Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'value' | 'validValues' | 'defaultValue' | 'features'>> }
  )> };

export type GetDriverByIdQueryVariables = Exact<{
  driverId: Scalars['ID'];
}>;

export type GetDriverByIdQuery = { driverList: Array<Pick<DriverInfo, 'id' | 'name' | 'icon'>> };

export type InitConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  credentials?: Maybe<Scalars['Object']>;
}>;

export type InitConnectionMutation = { connection: Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'> };

export type RefreshSessionConnectionsMutationVariables = Exact<{ [key: string]: never; }>;

export type RefreshSessionConnectionsMutation = Pick<Mutation, 'refreshSessionConnections'>;

export type GetTemplateConnectionsQueryVariables = Exact<{ [key: string]: never; }>;

export type GetTemplateConnectionsQuery = { connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'>> };

export type TestConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
}>;

export type TestConnectionMutation = { testConnection: Pick<ConnectionInfo, 'id'> };

export type ExportDataFromContainerQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export type ExportDataFromContainerQuery = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ) };

export type ExportDataFromResultsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export type ExportDataFromResultsQuery = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ) };

export type GetDataTransferProcessorsQueryVariables = Exact<{ [key: string]: never; }>;

export type GetDataTransferProcessorsQuery = { processors: Array<(
    Pick<DataTransferProcessorInfo, 'id' | 'name' | 'description' | 'fileExtension' | 'appFileExtension' | 'appName' | 'order' | 'icon' | 'isBinary' | 'isHTML'>
    & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues' | 'features'>>>> }
  )> };

export type RemoveDataTransferFileQueryVariables = Exact<{
  dataFileId: Scalars['String'];
}>;

export type RemoveDataTransferFileQuery = { result: Query['dataTransferRemoveDataFile'] };

export type NavGetStructContainersQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  catalogId?: Maybe<Scalars['ID']>;
}>;

export type NavGetStructContainersQuery = { navGetStructContainers: { catalogList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>>, schemaList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>> } };

export type GetAsyncTaskInfoMutationVariables = Exact<{
  taskId: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
}>;

export type GetAsyncTaskInfoMutation = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ) };

export type AsyncSqlExecuteQueryMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export type AsyncSqlExecuteQueryMutation = { taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  ) };

export type GetSqlExecuteTaskResultsMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;

export type GetSqlExecuteTaskResultsMutation = { result: (
    Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
    & { results: Array<(
      Pick<SqlQueryResults, 'title' | 'updateRowCount' | 'sourceQuery' | 'dataFormat'>
      & { resultSet?: Maybe<(
        Pick<SqlResultSet, 'id' | 'rows' | 'hasMoreData'>
        & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'readOnly' | 'scale' | 'typeName'>>>> }
      )> }
    )> }
  ) };

export type ReadDataFromContainerMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export type ReadDataFromContainerMutation = { readDataFromContainer?: Maybe<(
    Pick<SqlExecuteInfo, 'duration' | 'statusMessage'>
    & { results: Array<(
      Pick<SqlQueryResults, 'title' | 'updateRowCount' | 'sourceQuery' | 'dataFormat'>
      & { resultSet?: Maybe<(
        Pick<SqlResultSet, 'id' | 'rows' | 'hasMoreData'>
        & { columns?: Maybe<Array<Maybe<Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'readOnly' | 'scale' | 'typeName'>>>> }
      )> }
    )> }
  )> };

export type UpdateResultsDataMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  sourceRowValues: Array<Maybe<Scalars['Object']>>;
  values?: Maybe<Scalars['Object']>;
}>;

export type UpdateResultsDataMutation = { result?: Maybe<(
    Pick<SqlExecuteInfo, 'duration'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount'>
      & { resultSet?: Maybe<Pick<SqlResultSet, 'id' | 'rows'>> }
    )> }
  )> };

export type UpdateResultsDataBatchMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<Array<SqlResultRow>>;
  deletedRows?: Maybe<Array<SqlResultRow>>;
  addedRows?: Maybe<Array<SqlResultRow>>;
}>;

export type UpdateResultsDataBatchMutation = { result?: Maybe<(
    Pick<SqlExecuteInfo, 'duration'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount'>
      & { resultSet?: Maybe<Pick<SqlResultSet, 'id' | 'rows'>> }
    )> }
  )> };

export type MetadataGetNodeDdlQueryVariables = Exact<{
  nodeId: Scalars['ID'];
}>;

export type MetadataGetNodeDdlQuery = Pick<Query, 'metadataGetNodeDDL'>;

export type GetChildrenDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export type GetChildrenDbObjectInfoQuery = { dbObjects: Array<(
    Pick<NavigatorNodeInfo, 'id'>
    & { object?: Maybe<(
      Pick<DatabaseObjectInfo, 'features'>
      & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value'>>>> }
    )> }
  )> };

export type GetDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export type GetDbObjectInfoQuery = { objectInfo: { object?: Maybe<(
      Pick<DatabaseObjectInfo, 'features'>
      & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value'>>>> }
    )> } };

export type NavNodeChildrenQueryVariables = Exact<{
  parentPath: Scalars['ID'];
}>;

export type NavNodeChildrenQuery = { navNodeChildren: Array<(
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  )>, navNodeInfo: (
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  ) };

export type NavNodeInfoQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;

export type NavNodeInfoQuery = { navNodeInfo: (
    Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
    & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>> }
  ) };

export type NavRefreshNodeQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;

export type NavRefreshNodeQuery = Pick<Query, 'navRefreshNode'>;

export type QuerySqlCompletionProposalsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  position: Scalars['Int'];
  query: Scalars['String'];
  maxResults?: Maybe<Scalars['Int']>;
}>;

export type QuerySqlCompletionProposalsQuery = { sqlCompletionProposals?: Maybe<Array<Maybe<Pick<SqlCompletionProposal, 'cursorPosition' | 'displayString' | 'icon' | 'nodePath' | 'replacementLength' | 'replacementOffset' | 'replacementString' | 'score' | 'type'>>>> };

export type QuerySqlDialectInfoQueryVariables = Exact<{
  connectionId: Scalars['ID'];
}>;

export type QuerySqlDialectInfoQuery = { dialect?: Maybe<Pick<SqlDialectInfo, 'name' | 'dataTypes' | 'functions' | 'reservedWords' | 'quoteStrings' | 'singleLineComments' | 'multiLineComments' | 'catalogSeparator' | 'structSeparator' | 'scriptDelimiter'>> };

export type ConfigureServerQueryVariables = Exact<{
  configuration: ServerConfigInput;
}>;

export type ConfigureServerQuery = Pick<Query, 'configureServer'>;

export type SetDefaultNavigatorSettingsQueryVariables = Exact<{
  settings: NavigatorSettingsInput;
}>;

export type SetDefaultNavigatorSettingsQuery = Pick<Query, 'setDefaultNavigatorSettings'>;

export type ChangeSessionLanguageMutationVariables = Exact<{
  locale: Scalars['String'];
}>;

export type ChangeSessionLanguageMutation = Pick<Mutation, 'changeSessionLanguage'>;

export type OpenSessionMutationVariables = Exact<{ [key: string]: never; }>;

export type OpenSessionMutation = { session: (
    Pick<SessionInfo, 'createTime' | 'lastAccessTime' | 'cacheExpired' | 'locale'>
    & { connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'readOnly' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'>> }
  ) };

export type ReadSessionLogQueryVariables = Exact<{
  maxEntries: Scalars['Int'];
  clearEntries: Scalars['Boolean'];
}>;

export type ReadSessionLogQuery = { log: Array<Pick<LogEntry, 'time' | 'type' | 'message' | 'stackTrace'>> };

export type ServerConfigQueryVariables = Exact<{ [key: string]: never; }>;

export type ServerConfigQuery = { serverConfig: (
    Pick<ServerConfig, 'name' | 'version' | 'productConfiguration' | 'supportsCustomConnections' | 'supportsConnectionBrowser' | 'supportsWorkspaces' | 'anonymousAccessEnabled' | 'authenticationEnabled' | 'configurationMode' | 'developmentMode'>
    & { supportedLanguages: Array<Pick<ServerLanguage, 'isoCode' | 'displayName' | 'nativeName'>>, defaultNavigatorSettings: Pick<NavigatorSettings, 'showSystemObjects' | 'showUtilityObjects' | 'showOnlyEntities' | 'mergeEntities' | 'hideFolders' | 'hideSchemas' | 'hideVirtualModel'> }
  ) };

export type SessionPermissionsQueryVariables = Exact<{ [key: string]: never; }>;

export type SessionPermissionsQuery = { permissions: Query['sessionPermissions'] };

export type SessionStateQueryVariables = Exact<{ [key: string]: never; }>;

export type SessionStateQuery = { sessionState: (
    Pick<SessionInfo, 'createTime' | 'lastAccessTime' | 'locale' | 'cacheExpired'>
    & { connections: Array<Pick<ConnectionInfo, 'id' | 'name' | 'driverId' | 'connected' | 'authNeeded' | 'authModel' | 'features' | 'supportedDataFormats'>> }
  ) };

export type TouchSessionMutationVariables = Exact<{ [key: string]: never; }>;

export type TouchSessionMutation = Pick<Mutation, 'touchSession'>;

export type SqlContextCreateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
}>;

export type SqlContextCreateMutation = { context: Pick<SqlContextInfo, 'id' | 'defaultCatalog' | 'defaultSchema'> };

export type SqlContextDestroyMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}>;

export type SqlContextDestroyMutation = Pick<Mutation, 'sqlContextDestroy'>;

export type SqlContextSetDefaultsMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
}>;

export type SqlContextSetDefaultsMutation = { context: Mutation['sqlContextSetDefaults'] };

export type SqlResultCloseMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
}>;

export type SqlResultCloseMutation = { result: Mutation['sqlResultClose'] };

export const AsyncTaskCancelDocument = `
    mutation asyncTaskCancel($taskId: String!) {
  result: asyncTaskCancel(id: $taskId)
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
export const GetUserGrantedConnectionsDocument = `
    query getUserGrantedConnections($userId: ID) {
  grantedConnections: getSubjectConnectionAccess(subjectId: $userId) {
    connectionId
    subjectId
    subjectType
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
export const RevokeUserRoleDocument = `
    query revokeUserRole($userId: ID!, $roleId: ID!) {
  revokeUserRole(userId: $userId, roleId: $roleId)
}
    `;
export const SetConnectionsDocument = `
    query setConnections($userId: ID!, $connections: [ID!]!) {
  grantedConnections: setSubjectConnectionAccess(subjectId: $userId, connections: $connections)
}
    `;
export const SetUserCredentialsDocument = `
    query setUserCredentials($userId: ID!, $providerId: ID!, $credentials: Object!) {
  setUserCredentials(userId: $userId, providerId: $providerId, credentials: $credentials)
}
    `;
export const CreateConnectionConfigurationDocument = `
    query createConnectionConfiguration($config: ConnectionConfig!) {
  connection: createConnectionConfiguration(config: $config) {
    id
    name
    description
    driverId
    template
    connected
    readOnly
    host
    port
    databaseName
    url
    properties
    features
    authNeeded
    authModel
    authProperties {
      id
      value
      features
    }
  }
}
    `;
export const DeleteConnectionConfigurationDocument = `
    query deleteConnectionConfiguration($id: ID!) {
  deleteConnectionConfiguration(id: $id)
}
    `;
export const GetConnectionAccessDocument = `
    query getConnectionAccess($connectionId: ID) {
  subjects: getConnectionSubjectAccess(connectionId: $connectionId) {
    connectionId
    subjectId
    subjectType
  }
}
    `;
export const GetConnectionsDocument = `
    query getConnections {
  connections: allConnections {
    id
    name
    description
    driverId
    template
    connected
    readOnly
    host
    port
    databaseName
    url
    properties
    authNeeded
    authModel
    authProperties {
      id
      value
      features
    }
    features
    supportedDataFormats
  }
}
    `;
export const SearchDatabasesDocument = `
    query searchDatabases($hosts: [String!]!) {
  databases: searchConnections(hostNames: $hosts) {
    host
    port
    possibleDrivers
    defaultDriver
  }
}
    `;
export const SetConnectionAccessDocument = `
    query setConnectionAccess($connectionId: ID!, $subjects: [ID!]!) {
  setConnectionSubjectAccess(connectionId: $connectionId, subjects: $subjects)
}
    `;
export const UpdateConnectionConfigurationDocument = `
    query updateConnectionConfiguration($id: ID!, $config: ConnectionConfig!) {
  connection: updateConnectionConfiguration(id: $id, config: $config) {
    id
    name
    description
    driverId
    template
    connected
    readOnly
    host
    port
    databaseName
    url
    properties
    authNeeded
    authModel
    authProperties {
      id
      value
      features
    }
    features
    supportedDataFormats
  }
}
    `;
export const CloseConnectionDocument = `
    mutation closeConnection($id: ID!) {
  connection: closeConnection(id: $id) {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
  }
}
    `;
export const ConnectionAuthPropertiesDocument = `
    query connectionAuthProperties($id: ID!) {
  connection: connectionInfo(id: $id) {
    authProperties {
      id
      displayName
      description
      category
      dataType
      value
      validValues
      defaultValue
      features
    }
  }
}
    `;
export const ConnectionInfoDocument = `
    query connectionInfo($id: ID!) {
  connection: connectionInfo(id: $id) {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
  }
}
    `;
export const CreateConnectionDocument = `
    mutation createConnection($config: ConnectionConfig!) {
  createConnection(config: $config) {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
  }
}
    `;
export const CreateConnectionFromTemplateDocument = `
    mutation createConnectionFromTemplate($templateId: ID!) {
  connection: createConnectionFromTemplate(templateId: $templateId) {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
  }
}
    `;
export const DeleteConnectionDocument = `
    mutation deleteConnection($id: ID!) {
  deleteConnection(id: $id)
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
    defaultDatabase
    defaultServer
    defaultUser
    sampleURL
    embedded
    anonymousAccess
    promotedScore
    defaultAuthModel
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
export const GetAuthModelsDocument = `
    query getAuthModels {
  models: authModels {
    id
    displayName
    description
    icon
    properties {
      id
      displayName
      description
      category
      dataType
      value
      validValues
      defaultValue
      features
    }
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
export const InitConnectionDocument = `
    mutation initConnection($id: ID!, $credentials: Object) {
  connection: initConnection(id: $id, credentials: $credentials) {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
  }
}
    `;
export const RefreshSessionConnectionsDocument = `
    mutation refreshSessionConnections {
  refreshSessionConnections
}
    `;
export const GetTemplateConnectionsDocument = `
    query getTemplateConnections {
  connections: templateConnections {
    id
    name
    description
    driverId
    connected
    readOnly
    authNeeded
    authModel
    features
    supportedDataFormats
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
export const GetAsyncTaskInfoDocument = `
    mutation getAsyncTaskInfo($taskId: String!, $removeOnFinish: Boolean!) {
  taskInfo: asyncTaskInfo(id: $taskId, removeOnFinish: $removeOnFinish) {
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
export const AsyncSqlExecuteQueryDocument = `
    mutation asyncSqlExecuteQuery($connectionId: ID!, $contextId: ID!, $query: String!, $filter: SQLDataFilter, $dataFormat: ResultDataFormat) {
  taskInfo: asyncSqlExecuteQuery(connectionId: $connectionId, contextId: $contextId, sql: $query, filter: $filter, dataFormat: $dataFormat) {
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
export const GetSqlExecuteTaskResultsDocument = `
    mutation getSqlExecuteTaskResults($taskId: ID!) {
  result: asyncSqlExecuteResults(taskId: $taskId) {
    duration
    statusMessage
    results {
      title
      updateRowCount
      sourceQuery
      dataFormat
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
          readOnly
          scale
          typeName
        }
        rows
        hasMoreData
      }
    }
  }
}
    `;
export const ReadDataFromContainerDocument = `
    mutation readDataFromContainer($connectionId: ID!, $contextId: ID!, $containerNodePath: ID!, $filter: SQLDataFilter, $dataFormat: ResultDataFormat) {
  readDataFromContainer(connectionId: $connectionId, contextId: $contextId, containerNodePath: $containerNodePath, filter: $filter, dataFormat: $dataFormat) {
    duration
    statusMessage
    results {
      title
      updateRowCount
      sourceQuery
      dataFormat
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
          readOnly
          scale
          typeName
        }
        rows
        hasMoreData
      }
    }
  }
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
export const UpdateResultsDataBatchDocument = `
    mutation updateResultsDataBatch($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $updatedRows: [SQLResultRow!], $deletedRows: [SQLResultRow!], $addedRows: [SQLResultRow!]) {
  result: updateResultsDataBatch(connectionId: $connectionId, contextId: $contextId, resultsId: $resultsId, updatedRows: $updatedRows, deletedRows: $deletedRows, addedRows: $addedRows) {
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
export const MetadataGetNodeDdlDocument = `
    query metadataGetNodeDDL($nodeId: ID!) {
  metadataGetNodeDDL(nodeId: $nodeId)
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
export const ConfigureServerDocument = `
    query configureServer($configuration: ServerConfigInput!) {
  configureServer(configuration: $configuration)
}
    `;
export const SetDefaultNavigatorSettingsDocument = `
    query setDefaultNavigatorSettings($settings: NavigatorSettingsInput!) {
  setDefaultNavigatorSettings(settings: $settings)
}
    `;
export const ChangeSessionLanguageDocument = `
    mutation changeSessionLanguage($locale: String!) {
  changeSessionLanguage(locale: $locale)
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
      readOnly
      authNeeded
      authModel
      features
      supportedDataFormats
    }
  }
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
export const ServerConfigDocument = `
    query serverConfig {
  serverConfig {
    name
    version
    productConfiguration
    supportsCustomConnections
    supportsConnectionBrowser
    supportsWorkspaces
    anonymousAccessEnabled
    authenticationEnabled
    configurationMode
    developmentMode
    supportedLanguages {
      isoCode
      displayName
      nativeName
    }
    productConfiguration
    defaultNavigatorSettings {
      showSystemObjects
      showUtilityObjects
      showOnlyEntities
      mergeEntities
      hideFolders
      hideSchemas
      hideVirtualModel
    }
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
      authNeeded
      authModel
      features
      supportedDataFormats
    }
  }
}
    `;
export const TouchSessionDocument = `
    mutation touchSession {
  touchSession
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

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    asyncTaskCancel(variables: AsyncTaskCancelMutationVariables): Promise<AsyncTaskCancelMutation> {
      return withWrapper(() => client.request<AsyncTaskCancelMutation>(AsyncTaskCancelDocument, variables));
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
    getUserGrantedConnections(variables?: GetUserGrantedConnectionsQueryVariables): Promise<GetUserGrantedConnectionsQuery> {
      return withWrapper(() => client.request<GetUserGrantedConnectionsQuery>(GetUserGrantedConnectionsDocument, variables));
    },
    getUsersList(variables?: GetUsersListQueryVariables): Promise<GetUsersListQuery> {
      return withWrapper(() => client.request<GetUsersListQuery>(GetUsersListDocument, variables));
    },
    grantUserRole(variables: GrantUserRoleQueryVariables): Promise<GrantUserRoleQuery> {
      return withWrapper(() => client.request<GrantUserRoleQuery>(GrantUserRoleDocument, variables));
    },
    revokeUserRole(variables: RevokeUserRoleQueryVariables): Promise<RevokeUserRoleQuery> {
      return withWrapper(() => client.request<RevokeUserRoleQuery>(RevokeUserRoleDocument, variables));
    },
    setConnections(variables: SetConnectionsQueryVariables): Promise<SetConnectionsQuery> {
      return withWrapper(() => client.request<SetConnectionsQuery>(SetConnectionsDocument, variables));
    },
    setUserCredentials(variables: SetUserCredentialsQueryVariables): Promise<SetUserCredentialsQuery> {
      return withWrapper(() => client.request<SetUserCredentialsQuery>(SetUserCredentialsDocument, variables));
    },
    createConnectionConfiguration(variables: CreateConnectionConfigurationQueryVariables): Promise<CreateConnectionConfigurationQuery> {
      return withWrapper(() => client.request<CreateConnectionConfigurationQuery>(CreateConnectionConfigurationDocument, variables));
    },
    deleteConnectionConfiguration(variables: DeleteConnectionConfigurationQueryVariables): Promise<DeleteConnectionConfigurationQuery> {
      return withWrapper(() => client.request<DeleteConnectionConfigurationQuery>(DeleteConnectionConfigurationDocument, variables));
    },
    getConnectionAccess(variables?: GetConnectionAccessQueryVariables): Promise<GetConnectionAccessQuery> {
      return withWrapper(() => client.request<GetConnectionAccessQuery>(GetConnectionAccessDocument, variables));
    },
    getConnections(variables?: GetConnectionsQueryVariables): Promise<GetConnectionsQuery> {
      return withWrapper(() => client.request<GetConnectionsQuery>(GetConnectionsDocument, variables));
    },
    searchDatabases(variables: SearchDatabasesQueryVariables): Promise<SearchDatabasesQuery> {
      return withWrapper(() => client.request<SearchDatabasesQuery>(SearchDatabasesDocument, variables));
    },
    setConnectionAccess(variables: SetConnectionAccessQueryVariables): Promise<SetConnectionAccessQuery> {
      return withWrapper(() => client.request<SetConnectionAccessQuery>(SetConnectionAccessDocument, variables));
    },
    updateConnectionConfiguration(variables: UpdateConnectionConfigurationQueryVariables): Promise<UpdateConnectionConfigurationQuery> {
      return withWrapper(() => client.request<UpdateConnectionConfigurationQuery>(UpdateConnectionConfigurationDocument, variables));
    },
    closeConnection(variables: CloseConnectionMutationVariables): Promise<CloseConnectionMutation> {
      return withWrapper(() => client.request<CloseConnectionMutation>(CloseConnectionDocument, variables));
    },
    connectionAuthProperties(variables: ConnectionAuthPropertiesQueryVariables): Promise<ConnectionAuthPropertiesQuery> {
      return withWrapper(() => client.request<ConnectionAuthPropertiesQuery>(ConnectionAuthPropertiesDocument, variables));
    },
    connectionInfo(variables: ConnectionInfoQueryVariables): Promise<ConnectionInfoQuery> {
      return withWrapper(() => client.request<ConnectionInfoQuery>(ConnectionInfoDocument, variables));
    },
    createConnection(variables: CreateConnectionMutationVariables): Promise<CreateConnectionMutation> {
      return withWrapper(() => client.request<CreateConnectionMutation>(CreateConnectionDocument, variables));
    },
    createConnectionFromTemplate(variables: CreateConnectionFromTemplateMutationVariables): Promise<CreateConnectionFromTemplateMutation> {
      return withWrapper(() => client.request<CreateConnectionFromTemplateMutation>(CreateConnectionFromTemplateDocument, variables));
    },
    deleteConnection(variables: DeleteConnectionMutationVariables): Promise<DeleteConnectionMutation> {
      return withWrapper(() => client.request<DeleteConnectionMutation>(DeleteConnectionDocument, variables));
    },
    driverList(variables?: DriverListQueryVariables): Promise<DriverListQuery> {
      return withWrapper(() => client.request<DriverListQuery>(DriverListDocument, variables));
    },
    driverProperties(variables: DriverPropertiesQueryVariables): Promise<DriverPropertiesQuery> {
      return withWrapper(() => client.request<DriverPropertiesQuery>(DriverPropertiesDocument, variables));
    },
    getAuthModels(variables?: GetAuthModelsQueryVariables): Promise<GetAuthModelsQuery> {
      return withWrapper(() => client.request<GetAuthModelsQuery>(GetAuthModelsDocument, variables));
    },
    getDriverById(variables: GetDriverByIdQueryVariables): Promise<GetDriverByIdQuery> {
      return withWrapper(() => client.request<GetDriverByIdQuery>(GetDriverByIdDocument, variables));
    },
    initConnection(variables: InitConnectionMutationVariables): Promise<InitConnectionMutation> {
      return withWrapper(() => client.request<InitConnectionMutation>(InitConnectionDocument, variables));
    },
    refreshSessionConnections(variables?: RefreshSessionConnectionsMutationVariables): Promise<RefreshSessionConnectionsMutation> {
      return withWrapper(() => client.request<RefreshSessionConnectionsMutation>(RefreshSessionConnectionsDocument, variables));
    },
    getTemplateConnections(variables?: GetTemplateConnectionsQueryVariables): Promise<GetTemplateConnectionsQuery> {
      return withWrapper(() => client.request<GetTemplateConnectionsQuery>(GetTemplateConnectionsDocument, variables));
    },
    testConnection(variables: TestConnectionMutationVariables): Promise<TestConnectionMutation> {
      return withWrapper(() => client.request<TestConnectionMutation>(TestConnectionDocument, variables));
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
    navGetStructContainers(variables: NavGetStructContainersQueryVariables): Promise<NavGetStructContainersQuery> {
      return withWrapper(() => client.request<NavGetStructContainersQuery>(NavGetStructContainersDocument, variables));
    },
    getAsyncTaskInfo(variables: GetAsyncTaskInfoMutationVariables): Promise<GetAsyncTaskInfoMutation> {
      return withWrapper(() => client.request<GetAsyncTaskInfoMutation>(GetAsyncTaskInfoDocument, variables));
    },
    asyncSqlExecuteQuery(variables: AsyncSqlExecuteQueryMutationVariables): Promise<AsyncSqlExecuteQueryMutation> {
      return withWrapper(() => client.request<AsyncSqlExecuteQueryMutation>(AsyncSqlExecuteQueryDocument, variables));
    },
    getSqlExecuteTaskResults(variables: GetSqlExecuteTaskResultsMutationVariables): Promise<GetSqlExecuteTaskResultsMutation> {
      return withWrapper(() => client.request<GetSqlExecuteTaskResultsMutation>(GetSqlExecuteTaskResultsDocument, variables));
    },
    readDataFromContainer(variables: ReadDataFromContainerMutationVariables): Promise<ReadDataFromContainerMutation> {
      return withWrapper(() => client.request<ReadDataFromContainerMutation>(ReadDataFromContainerDocument, variables));
    },
    updateResultsData(variables: UpdateResultsDataMutationVariables): Promise<UpdateResultsDataMutation> {
      return withWrapper(() => client.request<UpdateResultsDataMutation>(UpdateResultsDataDocument, variables));
    },
    updateResultsDataBatch(variables: UpdateResultsDataBatchMutationVariables): Promise<UpdateResultsDataBatchMutation> {
      return withWrapper(() => client.request<UpdateResultsDataBatchMutation>(UpdateResultsDataBatchDocument, variables));
    },
    metadataGetNodeDDL(variables: MetadataGetNodeDdlQueryVariables): Promise<MetadataGetNodeDdlQuery> {
      return withWrapper(() => client.request<MetadataGetNodeDdlQuery>(MetadataGetNodeDdlDocument, variables));
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
    querySqlCompletionProposals(variables: QuerySqlCompletionProposalsQueryVariables): Promise<QuerySqlCompletionProposalsQuery> {
      return withWrapper(() => client.request<QuerySqlCompletionProposalsQuery>(QuerySqlCompletionProposalsDocument, variables));
    },
    querySqlDialectInfo(variables: QuerySqlDialectInfoQueryVariables): Promise<QuerySqlDialectInfoQuery> {
      return withWrapper(() => client.request<QuerySqlDialectInfoQuery>(QuerySqlDialectInfoDocument, variables));
    },
    configureServer(variables: ConfigureServerQueryVariables): Promise<ConfigureServerQuery> {
      return withWrapper(() => client.request<ConfigureServerQuery>(ConfigureServerDocument, variables));
    },
    setDefaultNavigatorSettings(variables: SetDefaultNavigatorSettingsQueryVariables): Promise<SetDefaultNavigatorSettingsQuery> {
      return withWrapper(() => client.request<SetDefaultNavigatorSettingsQuery>(SetDefaultNavigatorSettingsDocument, variables));
    },
    changeSessionLanguage(variables: ChangeSessionLanguageMutationVariables): Promise<ChangeSessionLanguageMutation> {
      return withWrapper(() => client.request<ChangeSessionLanguageMutation>(ChangeSessionLanguageDocument, variables));
    },
    openSession(variables?: OpenSessionMutationVariables): Promise<OpenSessionMutation> {
      return withWrapper(() => client.request<OpenSessionMutation>(OpenSessionDocument, variables));
    },
    readSessionLog(variables: ReadSessionLogQueryVariables): Promise<ReadSessionLogQuery> {
      return withWrapper(() => client.request<ReadSessionLogQuery>(ReadSessionLogDocument, variables));
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
  };
}
export type Sdk = ReturnType<typeof getSdk>;
