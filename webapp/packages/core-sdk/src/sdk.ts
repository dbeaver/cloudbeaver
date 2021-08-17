/* eslint-disable max-len */
// @ts-expect-error uncontrolled
import { GraphQLClient } from 'graphql-request';
export type Maybe<T> = T;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export interface Scalars {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  DateTime: any;
  Object: any;
}

export interface AdminConnectionGrantInfo {
  connectionId: Scalars['ID'];
  subjectId: Scalars['ID'];
  subjectType: AdminSubjectType;
}

export interface AdminConnectionSearchInfo {
  displayName: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  possibleDrivers: Array<Scalars['ID']>;
  defaultDriver: Scalars['ID'];
}

export interface AdminPermissionInfo {
  id: Scalars['ID'];
  label?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  provider: Scalars['String'];
  category?: Maybe<Scalars['String']>;
}

export interface AdminRoleInfo {
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  rolePermissions: Array<Maybe<Scalars['ID']>>;
}

export enum AdminSubjectType {
  User = 'user',
  Role = 'role'
}

export interface AdminUserInfo {
  userId: Scalars['ID'];
  metaParameters: Scalars['Object'];
  configurationParameters: Scalars['Object'];
  grantedRoles: Array<Scalars['ID']>;
  grantedConnections: AdminConnectionGrantInfo[];
  origins: ObjectOrigin[];
  linkedAuthProviders: Array<Scalars['String']>;
}

export interface AsyncTaskInfo {
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  running: Scalars['Boolean'];
  status?: Maybe<Scalars['String']>;
  error?: Maybe<ServerError>;
  /** @deprecated Field no longer supported */
  result?: Maybe<SqlExecuteInfo>;
  taskResult?: Maybe<Scalars['Object']>;
}

export enum AuthCredentialEncryption {
  None = 'none',
  Plain = 'plain',
  Hash = 'hash'
}

export interface AuthCredentialInfo {
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  admin?: Maybe<Scalars['Boolean']>;
  user?: Maybe<Scalars['Boolean']>;
  identifying?: Maybe<Scalars['Boolean']>;
  possibleValues?: Maybe<Array<Maybe<Scalars['String']>>>;
  encryption?: Maybe<AuthCredentialEncryption>;
}

export interface AuthProviderInfo {
  id: Scalars['ID'];
  label: Scalars['String'];
  icon?: Maybe<Scalars['ID']>;
  description?: Maybe<Scalars['String']>;
  defaultProvider?: Maybe<Scalars['Boolean']>;
  credentialParameters: AuthCredentialInfo[];
}

export interface ConnectionConfig {
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
  providerProperties?: Maybe<Scalars['Object']>;
  networkHandlersConfig?: Maybe<NetworkHandlerConfigInput[]>;
  dataSourceId?: Maybe<Scalars['ID']>;
  userName?: Maybe<Scalars['String']>;
  userPassword?: Maybe<Scalars['String']>;
}

export interface ConnectionInfo {
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
  useUrl: Scalars['Boolean'];
  saveCredentials: Scalars['Boolean'];
  connectTime?: Maybe<Scalars['String']>;
  connectionError?: Maybe<ServerError>;
  serverVersion?: Maybe<Scalars['String']>;
  clientVersion?: Maybe<Scalars['String']>;
  origin: ObjectOrigin;
  authNeeded: Scalars['Boolean'];
  authModel?: Maybe<Scalars['ID']>;
  authProperties: ObjectPropertyInfo[];
  providerProperties: Scalars['Object'];
  networkHandlersConfig: NetworkHandlerConfig[];
  features: Array<Scalars['String']>;
  navigatorSettings: NavigatorSettings;
  supportedDataFormats: ResultDataFormat[];
}

export interface DataTransferParameters {
  processorId: Scalars['ID'];
  settings?: Maybe<Scalars['Object']>;
  processorProperties: Scalars['Object'];
  filter?: Maybe<SqlDataFilter>;
}

export interface DataTransferProcessorInfo {
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
}

export interface DataTypeLogicalOperation {
  id: Scalars['ID'];
  expression: Scalars['String'];
  argumentCount?: Maybe<Scalars['Int']>;
}

export interface DatabaseAuthModel {
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  properties: ObjectPropertyInfo[];
}

export interface DatabaseDocument {
  id?: Maybe<Scalars['String']>;
  contentType?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  data?: Maybe<Scalars['Object']>;
}

export interface DatabaseObjectInfo {
  name?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  ordinalPosition?: Maybe<Scalars['Int']>;
  fullyQualifiedName?: Maybe<Scalars['String']>;
  overloadedName?: Maybe<Scalars['String']>;
  uniqueName?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
  features?: Maybe<Array<Scalars['String']>>;
  editors?: Maybe<Array<Scalars['String']>>;
}

export interface DatabaseObjectInfoPropertiesArgs {
  filter?: Maybe<ObjectPropertyFilter>;
}

export interface DatabaseStructContainers {
  catalogList: DatabaseObjectInfo[];
  schemaList: DatabaseObjectInfo[];
}

export interface DriverInfo {
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
  driverProperties: ObjectPropertyInfo[];
  driverParameters: Scalars['Object'];
  providerProperties: ObjectPropertyInfo[];
  anonymousAccess?: Maybe<Scalars['Boolean']>;
  defaultAuthModel: Scalars['ID'];
  applicableAuthModel: Array<Scalars['ID']>;
  applicableNetworkHandlers: Array<Maybe<Scalars['ID']>>;
}

export interface LogEntry {
  time?: Maybe<Scalars['DateTime']>;
  type: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
}

export interface Mutation {
  asyncReadDataFromContainer: AsyncTaskInfo;
  asyncSqlExecuteQuery: AsyncTaskInfo;
  asyncSqlExecuteResults: SqlExecuteInfo;
  asyncSqlExplainExecutionPlan: AsyncTaskInfo;
  asyncSqlExplainExecutionPlanResult: SqlExecutionPlan;
  asyncTaskCancel?: Maybe<Scalars['Boolean']>;
  asyncTaskInfo: AsyncTaskInfo;
  /** @deprecated Field no longer supported */
  asyncTaskStatus: AsyncTaskInfo;
  changeSessionLanguage?: Maybe<Scalars['Boolean']>;
  closeConnection: ConnectionInfo;
  closeSession?: Maybe<Scalars['Boolean']>;
  copyConnectionFromNode: ConnectionInfo;
  createConnection: ConnectionInfo;
  createConnectionFromTemplate: ConnectionInfo;
  deleteConnection: Scalars['Boolean'];
  initConnection: ConnectionInfo;
  /** @deprecated Field no longer supported */
  openConnection: ConnectionInfo;
  openSession: SessionInfo;
  refreshSessionConnections?: Maybe<Scalars['Boolean']>;
  setConnectionNavigatorSettings: ConnectionInfo;
  sqlContextCreate: SqlContextInfo;
  sqlContextDestroy: Scalars['Boolean'];
  sqlContextSetDefaults: Scalars['Boolean'];
  sqlResultClose: Scalars['Boolean'];
  testConnection: ConnectionInfo;
  testNetworkHandler: NetworkEndpointInfo;
  touchSession?: Maybe<Scalars['Boolean']>;
  updateConnection: ConnectionInfo;
  updateResultsDataBatch: SqlExecuteInfo;
  updateResultsDataBatchScript: Scalars['String'];
}

export interface MutationAsyncReadDataFromContainerArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}

export interface MutationAsyncSqlExecuteQueryArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  sql: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}

export interface MutationAsyncSqlExecuteResultsArgs {
  taskId: Scalars['ID'];
}

export interface MutationAsyncSqlExplainExecutionPlanArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  configuration: Scalars['Object'];
}

export interface MutationAsyncSqlExplainExecutionPlanResultArgs {
  taskId: Scalars['ID'];
}

export interface MutationAsyncTaskCancelArgs {
  id: Scalars['String'];
}

export interface MutationAsyncTaskInfoArgs {
  id: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
}

export interface MutationAsyncTaskStatusArgs {
  id: Scalars['String'];
}

export interface MutationChangeSessionLanguageArgs {
  locale?: Maybe<Scalars['String']>;
}

export interface MutationCloseConnectionArgs {
  id: Scalars['ID'];
}

export interface MutationCopyConnectionFromNodeArgs {
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
}

export interface MutationCreateConnectionArgs {
  config: ConnectionConfig;
}

export interface MutationCreateConnectionFromTemplateArgs {
  templateId: Scalars['ID'];
  connectionName?: Maybe<Scalars['String']>;
}

export interface MutationDeleteConnectionArgs {
  id: Scalars['ID'];
}

export interface MutationInitConnectionArgs {
  id: Scalars['ID'];
  credentials?: Maybe<Scalars['Object']>;
  networkCredentials?: Maybe<NetworkHandlerConfigInput[]>;
  saveCredentials?: Maybe<Scalars['Boolean']>;
}

export interface MutationOpenConnectionArgs {
  config: ConnectionConfig;
}

export interface MutationSetConnectionNavigatorSettingsArgs {
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
}

export interface MutationSqlContextCreateArgs {
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
}

export interface MutationSqlContextDestroyArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}

export interface MutationSqlContextSetDefaultsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
}

export interface MutationSqlResultCloseArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
}

export interface MutationTestConnectionArgs {
  config: ConnectionConfig;
}

export interface MutationTestNetworkHandlerArgs {
  config: NetworkHandlerConfigInput;
}

export interface MutationUpdateConnectionArgs {
  config: ConnectionConfig;
}

export interface MutationUpdateResultsDataBatchArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[]>;
  deletedRows?: Maybe<SqlResultRow[]>;
  addedRows?: Maybe<SqlResultRow[]>;
}

export interface MutationUpdateResultsDataBatchScriptArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[]>;
  deletedRows?: Maybe<SqlResultRow[]>;
  addedRows?: Maybe<SqlResultRow[]>;
}

export interface NavigatorNodeInfo {
  id: Scalars['ID'];
  name?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  nodeType?: Maybe<Scalars['String']>;
  hasChildren?: Maybe<Scalars['Boolean']>;
  object?: Maybe<DatabaseObjectInfo>;
  features?: Maybe<Array<Scalars['String']>>;
  nodeDetails?: Maybe<ObjectPropertyInfo[]>;
  folder?: Maybe<Scalars['Boolean']>;
  inline?: Maybe<Scalars['Boolean']>;
  navigable?: Maybe<Scalars['Boolean']>;
}

export interface NavigatorSettings {
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
}

export interface NavigatorSettingsInput {
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
}

export interface NetworkEndpointInfo {
  message?: Maybe<Scalars['String']>;
  clientVersion?: Maybe<Scalars['String']>;
  serverVersion?: Maybe<Scalars['String']>;
}

export interface NetworkHandlerConfig {
  id: Scalars['ID'];
  enabled: Scalars['Boolean'];
  userName?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  savePassword: Scalars['Boolean'];
  properties: Scalars['Object'];
}

export interface NetworkHandlerConfigInput {
  id: Scalars['ID'];
  enabled?: Maybe<Scalars['Boolean']>;
  userName?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  savePassword?: Maybe<Scalars['Boolean']>;
  properties?: Maybe<Scalars['Object']>;
}

export interface NetworkHandlerDescriptor {
  id: Scalars['ID'];
  codeName: Scalars['String'];
  label: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  secured: Scalars['Boolean'];
  type?: Maybe<NetworkHandlerType>;
  properties: ObjectPropertyInfo[];
}

export enum NetworkHandlerType {
  Tunnel = 'TUNNEL',
  Proxy = 'PROXY',
  Config = 'CONFIG'
}

export interface ObjectDescriptor {
  id?: Maybe<Scalars['Int']>;
  displayName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  uniqueName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
}

export interface ObjectDetails {
  id?: Maybe<Scalars['Int']>;
  displayName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
}

export interface ObjectOrigin {
  type: Scalars['ID'];
  subType?: Maybe<Scalars['ID']>;
  displayName: Scalars['String'];
  icon?: Maybe<Scalars['String']>;
  configuration?: Maybe<Scalars['Object']>;
  details?: Maybe<ObjectPropertyInfo[]>;
}

export interface ObjectPropertyFilter {
  ids?: Maybe<Array<Scalars['String']>>;
  features?: Maybe<Array<Scalars['String']>>;
  categories?: Maybe<Array<Scalars['String']>>;
  dataTypes?: Maybe<Array<Scalars['String']>>;
}

export interface ObjectPropertyInfo {
  id?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  category?: Maybe<Scalars['String']>;
  dataType?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
  validValues?: Maybe<Array<Maybe<Scalars['Object']>>>;
  defaultValue?: Maybe<Scalars['Object']>;
  features: Array<Scalars['String']>;
  order: Scalars['Int'];
}

export interface ProductInfo {
  id: Scalars['ID'];
  version: Scalars['String'];
  name: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  buildTime: Scalars['String'];
  releaseTime: Scalars['String'];
  licenseInfo?: Maybe<Scalars['String']>;
}

export interface Query {
  activeUser?: Maybe<UserInfo>;
  allConnections: ConnectionInfo[];
  authChangeLocalPassword: Scalars['Boolean'];
  authLogin: UserAuthToken;
  authLogout?: Maybe<Scalars['Boolean']>;
  authModels: DatabaseAuthModel[];
  authProviders: AuthProviderInfo[];
  configureServer: Scalars['Boolean'];
  connectionInfo: ConnectionInfo;
  /** @deprecated Field no longer supported */
  connectionState: ConnectionInfo;
  copyConnectionConfiguration: ConnectionInfo;
  createConnectionConfiguration: ConnectionInfo;
  createRole: AdminRoleInfo;
  createUser: AdminUserInfo;
  dataTransferAvailableStreamProcessors: DataTransferProcessorInfo[];
  dataTransferExportDataFromContainer: AsyncTaskInfo;
  dataTransferExportDataFromResults: AsyncTaskInfo;
  dataTransferRemoveDataFile?: Maybe<Scalars['Boolean']>;
  deleteConnectionConfiguration?: Maybe<Scalars['Boolean']>;
  deleteRole?: Maybe<Scalars['Boolean']>;
  deleteUser?: Maybe<Scalars['Boolean']>;
  driverList: DriverInfo[];
  getConnectionSubjectAccess: AdminConnectionGrantInfo[];
  getSubjectConnectionAccess: AdminConnectionGrantInfo[];
  grantUserRole?: Maybe<Scalars['Boolean']>;
  listPermissions: Array<Maybe<AdminPermissionInfo>>;
  listRoles: Array<Maybe<AdminRoleInfo>>;
  listUsers: Array<Maybe<AdminUserInfo>>;
  metadataGetNodeDDL?: Maybe<Scalars['String']>;
  navGetStructContainers: DatabaseStructContainers;
  navNodeChildren: NavigatorNodeInfo[];
  navNodeInfo: NavigatorNodeInfo;
  navRefreshNode?: Maybe<Scalars['Boolean']>;
  networkHandlers: NetworkHandlerDescriptor[];
  readSessionLog: LogEntry[];
  revokeUserRole?: Maybe<Scalars['Boolean']>;
  searchConnections: AdminConnectionSearchInfo[];
  serverConfig: ServerConfig;
  sessionPermissions: Array<Maybe<Scalars['ID']>>;
  sessionState: SessionInfo;
  setConnectionSubjectAccess?: Maybe<Scalars['Boolean']>;
  setDefaultNavigatorSettings: Scalars['Boolean'];
  setSubjectConnectionAccess?: Maybe<Scalars['Boolean']>;
  setSubjectPermissions?: Maybe<Scalars['Boolean']>;
  setUserCredentials?: Maybe<Scalars['Boolean']>;
  sqlCompletionProposals?: Maybe<Array<Maybe<SqlCompletionProposal>>>;
  sqlDialectInfo?: Maybe<SqlDialectInfo>;
  sqlListContexts: Array<Maybe<SqlContextInfo>>;
  sqlSupportedOperations: DataTypeLogicalOperation[];
  templateConnections: ConnectionInfo[];
  updateConnectionConfiguration: ConnectionInfo;
  updateRole: AdminRoleInfo;
  userConnections: ConnectionInfo[];
}

export interface QueryAllConnectionsArgs {
  id?: Maybe<Scalars['ID']>;
}

export interface QueryAuthChangeLocalPasswordArgs {
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
}

export interface QueryAuthLoginArgs {
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
  linkUser?: Maybe<Scalars['Boolean']>;
}

export interface QueryAuthLogoutArgs {
  provider?: Maybe<Scalars['ID']>;
}

export interface QueryConfigureServerArgs {
  configuration: ServerConfigInput;
}

export interface QueryConnectionInfoArgs {
  id: Scalars['ID'];
}

export interface QueryConnectionStateArgs {
  id: Scalars['ID'];
}

export interface QueryCopyConnectionConfigurationArgs {
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
}

export interface QueryCreateConnectionConfigurationArgs {
  config: ConnectionConfig;
}

export interface QueryCreateRoleArgs {
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
}

export interface QueryCreateUserArgs {
  userId: Scalars['ID'];
}

export interface QueryDataTransferExportDataFromContainerArgs {
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
}

export interface QueryDataTransferExportDataFromResultsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
}

export interface QueryDataTransferRemoveDataFileArgs {
  dataFileId: Scalars['String'];
}

export interface QueryDeleteConnectionConfigurationArgs {
  id: Scalars['ID'];
}

export interface QueryDeleteRoleArgs {
  roleId: Scalars['ID'];
}

export interface QueryDeleteUserArgs {
  userId: Scalars['ID'];
}

export interface QueryDriverListArgs {
  id?: Maybe<Scalars['ID']>;
}

export interface QueryGetConnectionSubjectAccessArgs {
  connectionId?: Maybe<Scalars['ID']>;
}

export interface QueryGetSubjectConnectionAccessArgs {
  subjectId?: Maybe<Scalars['ID']>;
}

export interface QueryGrantUserRoleArgs {
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}

export interface QueryListRolesArgs {
  roleId?: Maybe<Scalars['ID']>;
}

export interface QueryListUsersArgs {
  userId?: Maybe<Scalars['ID']>;
}

export interface QueryMetadataGetNodeDdlArgs {
  nodeId: Scalars['ID'];
  options?: Maybe<Scalars['Object']>;
}

export interface QueryNavGetStructContainersArgs {
  connectionId: Scalars['ID'];
  catalog?: Maybe<Scalars['ID']>;
}

export interface QueryNavNodeChildrenArgs {
  parentPath: Scalars['ID'];
  offset?: Maybe<Scalars['Int']>;
  limit?: Maybe<Scalars['Int']>;
  onlyFolders?: Maybe<Scalars['Boolean']>;
}

export interface QueryNavNodeInfoArgs {
  nodePath: Scalars['ID'];
}

export interface QueryNavRefreshNodeArgs {
  nodePath: Scalars['ID'];
}

export interface QueryReadSessionLogArgs {
  maxEntries?: Maybe<Scalars['Int']>;
  clearEntries?: Maybe<Scalars['Boolean']>;
}

export interface QueryRevokeUserRoleArgs {
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}

export interface QuerySearchConnectionsArgs {
  hostNames: Array<Scalars['String']>;
}

export interface QuerySetConnectionSubjectAccessArgs {
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']>;
}

export interface QuerySetDefaultNavigatorSettingsArgs {
  settings: NavigatorSettingsInput;
}

export interface QuerySetSubjectConnectionAccessArgs {
  subjectId: Scalars['ID'];
  connections: Array<Scalars['ID']>;
}

export interface QuerySetSubjectPermissionsArgs {
  roleId: Scalars['ID'];
  permissions: Array<Scalars['ID']>;
}

export interface QuerySetUserCredentialsArgs {
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
}

export interface QuerySqlCompletionProposalsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  position: Scalars['Int'];
  maxResults?: Maybe<Scalars['Int']>;
  simpleMode?: Maybe<Scalars['Boolean']>;
}

export interface QuerySqlDialectInfoArgs {
  connectionId: Scalars['ID'];
}

export interface QuerySqlListContextsArgs {
  connectionId?: Maybe<Scalars['ID']>;
  contextId?: Maybe<Scalars['ID']>;
}

export interface QuerySqlSupportedOperationsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  attributeIndex: Scalars['Int'];
}

export interface QueryUpdateConnectionConfigurationArgs {
  id: Scalars['ID'];
  config: ConnectionConfig;
}

export interface QueryUpdateRoleArgs {
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
}

export interface QueryUserConnectionsArgs {
  id?: Maybe<Scalars['ID']>;
}

export enum ResultDataFormat {
  Resultset = 'resultset',
  Document = 'document',
  Graph = 'graph',
  Timeseries = 'timeseries'
}

export interface SqlCompletionProposal {
  displayString: Scalars['String'];
  type: Scalars['String'];
  score?: Maybe<Scalars['Int']>;
  replacementString: Scalars['String'];
  replacementOffset: Scalars['Int'];
  replacementLength: Scalars['Int'];
  cursorPosition?: Maybe<Scalars['Int']>;
  icon?: Maybe<Scalars['String']>;
  nodePath?: Maybe<Scalars['String']>;
}

export interface SqlContextInfo {
  id: Scalars['ID'];
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
}

export interface SqlDataFilter {
  offset?: Maybe<Scalars['Float']>;
  limit?: Maybe<Scalars['Int']>;
  constraints?: Maybe<Array<Maybe<SqlDataFilterConstraint>>>;
  where?: Maybe<Scalars['String']>;
  orderBy?: Maybe<Scalars['String']>;
}

export interface SqlDataFilterConstraint {
  attribute: Scalars['String'];
  orderPosition?: Maybe<Scalars['Int']>;
  orderAsc?: Maybe<Scalars['Boolean']>;
  criteria?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['Object']>;
}

export interface SqlDialectInfo {
  name: Scalars['String'];
  dataTypes: Array<Maybe<Scalars['String']>>;
  functions: Array<Maybe<Scalars['String']>>;
  reservedWords: Array<Maybe<Scalars['String']>>;
  quoteStrings: Array<Maybe<Array<Maybe<Scalars['String']>>>>;
  singleLineComments: Array<Maybe<Scalars['String']>>;
  multiLineComments: Array<Maybe<Array<Maybe<Scalars['String']>>>>;
  catalogSeparator?: Maybe<Scalars['String']>;
  structSeparator?: Maybe<Scalars['String']>;
  scriptDelimiter?: Maybe<Scalars['String']>;
  supportsExplainExecutionPlan: Scalars['Boolean'];
}

export interface SqlExecuteInfo {
  statusMessage?: Maybe<Scalars['String']>;
  duration: Scalars['Int'];
  filterText?: Maybe<Scalars['String']>;
  results: SqlQueryResults[];
}

export interface SqlExecutionPlan {
  query: Scalars['String'];
  nodes: SqlExecutionPlanNode[];
}

export interface SqlExecutionPlanNode {
  id: Scalars['ID'];
  parentId?: Maybe<Scalars['ID']>;
  kind: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  type: Scalars['String'];
  condition?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  properties: ObjectPropertyInfo[];
}

export interface SqlQueryResults {
  title?: Maybe<Scalars['String']>;
  updateRowCount?: Maybe<Scalars['Float']>;
  sourceQuery?: Maybe<Scalars['String']>;
  dataFormat?: Maybe<ResultDataFormat>;
  resultSet?: Maybe<SqlResultSet>;
}

export interface SqlResultColumn {
  position: Scalars['Int'];
  name?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  dataKind?: Maybe<Scalars['String']>;
  typeName?: Maybe<Scalars['String']>;
  fullTypeName?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Float']>;
  scale?: Maybe<Scalars['Int']>;
  precision?: Maybe<Scalars['Int']>;
  required: Scalars['Boolean'];
  readOnly: Scalars['Boolean'];
  readOnlyStatus?: Maybe<Scalars['String']>;
  supportedOperations: DataTypeLogicalOperation[];
}

export interface SqlResultRow {
  data: Array<Maybe<Scalars['Object']>>;
  updateValues?: Maybe<Scalars['Object']>;
}

export interface SqlResultSet {
  id: Scalars['ID'];
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars['Object']>>>>>;
  hasMoreData?: Maybe<Scalars['Boolean']>;
}

export interface ServerConfig {
  name: Scalars['String'];
  version: Scalars['String'];
  workspaceId: Scalars['ID'];
  serverURL: Scalars['String'];
  rootURI: Scalars['String'];
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  supportsCustomConnections?: Maybe<Scalars['Boolean']>;
  supportsConnectionBrowser?: Maybe<Scalars['Boolean']>;
  supportsWorkspaces?: Maybe<Scalars['Boolean']>;
  publicCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  adminCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  licenseRequired: Scalars['Boolean'];
  licenseValid: Scalars['Boolean'];
  sessionExpireTime?: Maybe<Scalars['Int']>;
  localHostAddress?: Maybe<Scalars['String']>;
  configurationMode?: Maybe<Scalars['Boolean']>;
  developmentMode?: Maybe<Scalars['Boolean']>;
  enabledAuthProviders: Array<Scalars['ID']>;
  supportedLanguages: ServerLanguage[];
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  productConfiguration: Scalars['Object'];
  productInfo: ProductInfo;
  defaultNavigatorSettings: NavigatorSettings;
}

export interface ServerConfigInput {
  serverName?: Maybe<Scalars['String']>;
  serverURL?: Maybe<Scalars['String']>;
  adminName?: Maybe<Scalars['String']>;
  adminPassword?: Maybe<Scalars['String']>;
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  customConnectionsEnabled?: Maybe<Scalars['Boolean']>;
  publicCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  adminCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  enabledAuthProviders?: Maybe<Array<Scalars['ID']>>;
  sessionExpireTime?: Maybe<Scalars['Int']>;
}

export interface ServerError {
  message?: Maybe<Scalars['String']>;
  errorCode?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
  causedBy?: Maybe<ServerError>;
}

export interface ServerLanguage {
  isoCode: Scalars['String'];
  displayName?: Maybe<Scalars['String']>;
  nativeName?: Maybe<Scalars['String']>;
}

export interface ServerMessage {
  time?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
}

export interface SessionInfo {
  createTime: Scalars['String'];
  lastAccessTime: Scalars['String'];
  locale: Scalars['String'];
  cacheExpired: Scalars['Boolean'];
  serverMessages?: Maybe<Array<Maybe<ServerMessage>>>;
  connections: ConnectionInfo[];
}

export interface UserAuthToken {
  authProvider: Scalars['ID'];
  loginTime: Scalars['DateTime'];
  userId: Scalars['String'];
  displayName: Scalars['String'];
  message?: Maybe<Scalars['String']>;
  origin: ObjectOrigin;
}

export interface UserInfo {
  userId: Scalars['ID'];
  displayName?: Maybe<Scalars['String']>;
  authTokens: UserAuthToken[];
  linkedAuthProviders: Array<Scalars['String']>;
}

export interface WebServiceConfig {
  id: Scalars['String'];
  name: Scalars['String'];
  description: Scalars['String'];
  bundleVersion: Scalars['String'];
}

export type AsyncTaskCancelMutationVariables = Exact<{
  taskId: Scalars['String'];
}>;

export interface AsyncTaskCancelMutation { result: Mutation['asyncTaskCancel'] }

export type AuthChangeLocalPasswordQueryVariables = Exact<{
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
}>;

export type AuthChangeLocalPasswordQuery = Pick<Query, 'authChangeLocalPassword'>;

export type AuthLoginQueryVariables = Exact<{
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
  linkUser?: Maybe<Scalars['Boolean']>;
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface AuthLoginQuery { authToken: AuthTokenFragment }

export type AuthLogoutQueryVariables = Exact<{ [key: string]: never }>;

export type AuthLogoutQuery = Pick<Query, 'authLogout'>;

export type GetActiveUserQueryVariables = Exact<{
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface GetActiveUserQuery {
  user?: Maybe<(
    Pick<UserInfo, 'userId' | 'displayName' | 'linkedAuthProviders'>
    & { authTokens: AuthTokenFragment[] }
  )>;
}

export type GetAuthProvidersQueryVariables = Exact<{ [key: string]: never }>;

export interface GetAuthProvidersQuery {
  providers: Array<(
    Pick<AuthProviderInfo, 'id' | 'label' | 'icon' | 'description' | 'defaultProvider'>
    & { credentialParameters: Array<Pick<AuthCredentialInfo, 'id' | 'displayName' | 'description' | 'admin' | 'user' | 'identifying' | 'possibleValues' | 'encryption'>> }
  )>;
}

export type CreateUserQueryVariables = Exact<{
  userId: Scalars['ID'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface CreateUserQuery { user: AdminUserInfoFragment }

export type DeleteUserQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;

export type DeleteUserQuery = Pick<Query, 'deleteUser'>;

export type GetPermissionsListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export interface GetPermissionsListQuery { permissions: Array<Maybe<Pick<AdminPermissionInfo, 'id' | 'label' | 'description' | 'provider' | 'category'>>> }

export type GetRolesListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export interface GetRolesListQuery { roles: Array<Maybe<Pick<AdminRoleInfo, 'roleId' | 'roleName' | 'description'>>> }

export type GetUserGrantedConnectionsQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
}>;

export interface GetUserGrantedConnectionsQuery { grantedConnections: Array<Pick<AdminConnectionGrantInfo, 'connectionId' | 'subjectId' | 'subjectType'>> }

export type GetUsersListQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface GetUsersListQuery { users: Array<Maybe<AdminUserInfoFragment>> }

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
  connections: Array<Scalars['ID']> | Scalars['ID'];
}>;

export interface SetConnectionsQuery { grantedConnections: Query['setSubjectConnectionAccess'] }

export type SetUserCredentialsQueryVariables = Exact<{
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
}>;

export type SetUserCredentialsQuery = Pick<Query, 'setUserCredentials'>;

export type CreateConnectionConfigurationQueryVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionConfigurationQuery { connection: DatabaseConnectionFragment }

export type CreateConnectionConfigurationFromNodeQueryVariables = Exact<{
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionConfigurationFromNodeQuery { connection: DatabaseConnectionFragment }

export type DeleteConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export type DeleteConnectionConfigurationQuery = Pick<Query, 'deleteConnectionConfiguration'>;

export type GetConnectionAccessQueryVariables = Exact<{
  connectionId?: Maybe<Scalars['ID']>;
}>;

export interface GetConnectionAccessQuery { subjects: Array<Pick<AdminConnectionGrantInfo, 'connectionId' | 'subjectId' | 'subjectType'>> }

export type GetConnectionsQueryVariables = Exact<{
  id?: Maybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetConnectionsQuery { connections: DatabaseConnectionFragment[] }

export type SearchDatabasesQueryVariables = Exact<{
  hosts: Array<Scalars['String']> | Scalars['String'];
}>;

export interface SearchDatabasesQuery { databases: Array<Pick<AdminConnectionSearchInfo, 'displayName' | 'host' | 'port' | 'possibleDrivers' | 'defaultDriver'>> }

export type SetConnectionAccessQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']> | Scalars['ID'];
}>;

export type SetConnectionAccessQuery = Pick<Query, 'setConnectionSubjectAccess'>;

export type UpdateConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface UpdateConnectionConfigurationQuery { connection: DatabaseConnectionFragment }

export type CloseConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CloseConnectionMutation { connection: DatabaseConnectionFragment }

export type CreateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionMutation { connection: DatabaseConnectionFragment }

export type CreateConnectionFromNodeMutationVariables = Exact<{
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionFromNodeMutation { connection: DatabaseConnectionFragment }

export type CreateConnectionFromTemplateMutationVariables = Exact<{
  templateId: Scalars['ID'];
  connectionName: Scalars['String'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionFromTemplateMutation { connection: DatabaseConnectionFragment }

export type DeleteConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;

export type DeleteConnectionMutation = Pick<Mutation, 'deleteConnection'>;

export type DriverListQueryVariables = Exact<{
  driverId?: Maybe<Scalars['ID']>;
  includeProviderProperties: Scalars['Boolean'];
  includeDriverProperties: Scalars['Boolean'];
  includeDriverParameters: Scalars['Boolean'];
}>;

export interface DriverListQuery { drivers: DatabaseDriverFragment[] }

export type ExecutionContextCreateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
}>;

export interface ExecutionContextCreateMutation { context: Pick<SqlContextInfo, 'id' | 'connectionId' | 'defaultCatalog' | 'defaultSchema'> }

export type ExecutionContextDestroyMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}>;

export type ExecutionContextDestroyMutation = Pick<Mutation, 'sqlContextDestroy'>;

export type ExecutionContextListQueryVariables = Exact<{
  connectionId?: Maybe<Scalars['ID']>;
  contextId?: Maybe<Scalars['ID']>;
}>;

export interface ExecutionContextListQuery { contexts: Array<Maybe<Pick<SqlContextInfo, 'id' | 'connectionId' | 'defaultCatalog' | 'defaultSchema'>>> }

export type ExecutionContextUpdateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
}>;

export interface ExecutionContextUpdateMutation { context: Mutation['sqlContextSetDefaults'] }

export type GetAuthModelsQueryVariables = Exact<{ [key: string]: never }>;

export interface GetAuthModelsQuery {
  models: Array<(
    Pick<DatabaseAuthModel, 'id' | 'displayName' | 'description' | 'icon'>
    & { properties: Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'validValues' | 'defaultValue' | 'features' | 'order'>> }
  )>;
}

export type GetTemplateConnectionsQueryVariables = Exact<{
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetTemplateConnectionsQuery { connections: DatabaseConnectionFragment[] }

export type GetUserConnectionsQueryVariables = Exact<{
  id?: Maybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetUserConnectionsQuery { connections: DatabaseConnectionFragment[] }

export type InitConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  credentials?: Maybe<Scalars['Object']>;
  networkCredentials?: Maybe<NetworkHandlerConfigInput[] | NetworkHandlerConfigInput>;
  saveCredentials?: Maybe<Scalars['Boolean']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface InitConnectionMutation { connection: DatabaseConnectionFragment }

export type RefreshSessionConnectionsMutationVariables = Exact<{ [key: string]: never }>;

export type RefreshSessionConnectionsMutation = Pick<Mutation, 'refreshSessionConnections'>;

export type SetConnectionNavigatorSettingsMutationVariables = Exact<{
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface SetConnectionNavigatorSettingsMutation { connection: DatabaseConnectionFragment }

export type TestConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
}>;

export interface TestConnectionMutation {
  connection: (
    Pick<ConnectionInfo, 'id' | 'connectTime' | 'serverVersion' | 'clientVersion'>
    & { connectionError?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type TestNetworkHandlerMutationVariables = Exact<{
  config: NetworkHandlerConfigInput;
}>;

export interface TestNetworkHandlerMutation { info: Pick<NetworkEndpointInfo, 'message' | 'clientVersion' | 'serverVersion'> }

export type UpdateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface UpdateConnectionMutation { connection: DatabaseConnectionFragment }

export type ExportDataFromContainerQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export interface ExportDataFromContainerQuery {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type ExportDataFromResultsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export interface ExportDataFromResultsQuery {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'running' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type GetDataTransferProcessorsQueryVariables = Exact<{ [key: string]: never }>;

export interface GetDataTransferProcessorsQuery {
  processors: Array<(
    Pick<DataTransferProcessorInfo, 'id' | 'name' | 'description' | 'fileExtension' | 'appFileExtension' | 'appName' | 'order' | 'icon' | 'isBinary' | 'isHTML'>
    & { properties?: Maybe<Array<Maybe<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues' | 'features' | 'order'>>>> }
  )>;
}

export type RemoveDataTransferFileQueryVariables = Exact<{
  dataFileId: Scalars['String'];
}>;

export interface RemoveDataTransferFileQuery { result: Query['dataTransferRemoveDataFile'] }

export type NavGetStructContainersQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  catalogId?: Maybe<Scalars['ID']>;
}>;

export interface NavGetStructContainersQuery { navGetStructContainers: { catalogList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>>; schemaList: Array<Pick<DatabaseObjectInfo, 'name' | 'description' | 'type' | 'features'>> } }

export type AdminUserInfoFragment = (
  Pick<AdminUserInfo, 'userId' | 'grantedRoles' | 'linkedAuthProviders'>
  & { origins: ObjectOriginInfoFragment[] }
);

export type AllNavigatorSettingsFragment = Pick<NavigatorSettings, 'showSystemObjects' | 'showUtilityObjects' | 'showOnlyEntities' | 'mergeEntities' | 'hideFolders' | 'hideSchemas' | 'hideVirtualModel'>;

export type AuthTokenFragment = (
  Pick<UserAuthToken, 'authProvider' | 'loginTime' | 'message'>
  & { origin: ObjectOriginInfoFragment }
);

export type DatabaseConnectionFragment = (
  Pick<ConnectionInfo, 'id' | 'name' | 'description' | 'driverId' | 'template' | 'connected' | 'provided' | 'useUrl' | 'readOnly' | 'saveCredentials' | 'host' | 'port' | 'databaseName' | 'url' | 'properties' | 'providerProperties' | 'features' | 'supportedDataFormats' | 'authNeeded' | 'authModel'>
  & { origin?: Maybe<ObjectOriginInfoFragment>; authProperties?: Maybe<UserConnectionAuthPropertiesFragment[]>; networkHandlersConfig: Array<MakeOptional<Pick<NetworkHandlerConfig, 'id' | 'enabled' | 'userName' | 'password' | 'savePassword' | 'properties'>, 'userName' | 'password' | 'properties'>>; navigatorSettings: AllNavigatorSettingsFragment }
);

export type DatabaseDriverFragment = (
  MakeOptional<Pick<DriverInfo, 'id' | 'name' | 'icon' | 'description' | 'defaultPort' | 'defaultDatabase' | 'defaultServer' | 'defaultUser' | 'sampleURL' | 'embedded' | 'anonymousAccess' | 'promotedScore' | 'defaultAuthModel' | 'applicableNetworkHandlers' | 'driverParameters'>, 'driverParameters'>
  & { providerProperties?: Maybe<Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues' | 'features' | 'order'>>>; driverProperties?: Maybe<Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues'>>> }
);

export type NavNodeInfoFragment = (
  Pick<NavigatorNodeInfo, 'id' | 'name' | 'hasChildren' | 'nodeType' | 'icon' | 'folder' | 'inline' | 'navigable' | 'features'>
  & { object?: Maybe<Pick<DatabaseObjectInfo, 'features'>>; nodeDetails?: Maybe<NavNodePropertiesFragment[]> }
);

export type NavNodePropertiesFragment = Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value' | 'order'>;

export type ObjectOriginInfoFragment = (
  Pick<ObjectOrigin, 'type' | 'subType' | 'displayName' | 'icon'>
  & { details?: Maybe<Array<Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'defaultValue' | 'validValues' | 'value' | 'features' | 'order'>>> }
);

export type SessionStateFragment = Pick<SessionInfo, 'createTime' | 'lastAccessTime' | 'cacheExpired' | 'locale'>;

export type UserConnectionAuthPropertiesFragment = Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'value' | 'validValues' | 'defaultValue' | 'features' | 'order'>;

export type UserConnectionNetworkHandlerPropertiesFragment = Pick<ObjectPropertyInfo, 'id' | 'displayName' | 'description' | 'category' | 'dataType' | 'value' | 'validValues' | 'defaultValue' | 'order' | 'features'>;

export type GetAsyncTaskInfoMutationVariables = Exact<{
  taskId: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
}>;

export interface GetAsyncTaskInfoMutation {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type GetNetworkHandlersQueryVariables = Exact<{ [key: string]: never }>;

export interface GetNetworkHandlersQuery {
  handlers: Array<(
    Pick<NetworkHandlerDescriptor, 'id' | 'codeName' | 'label' | 'description' | 'secured' | 'type'>
    & { properties: UserConnectionNetworkHandlerPropertiesFragment[] }
  )>;
}

export type AsyncReadDataFromContainerMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export interface AsyncReadDataFromContainerMutation {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type AsyncSqlExecuteQueryMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export interface AsyncSqlExecuteQueryMutation {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type AsyncSqlExplainExecutionPlanMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  configuration: Scalars['Object'];
}>;

export interface AsyncSqlExplainExecutionPlanMutation {
  taskInfo: (
    Pick<AsyncTaskInfo, 'id' | 'name' | 'running' | 'status' | 'taskResult'>
    & { error?: Maybe<Pick<ServerError, 'message' | 'errorCode' | 'stackTrace'>> }
  );
}

export type GetSqlExecuteTaskResultsMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;

export interface GetSqlExecuteTaskResultsMutation {
  result: (
    Pick<SqlExecuteInfo, 'duration' | 'statusMessage' | 'filterText'>
    & { results: Array<(
      Pick<SqlQueryResults, 'title' | 'updateRowCount' | 'sourceQuery' | 'dataFormat'>
      & { resultSet?: Maybe<(
        Pick<SqlResultSet, 'id' | 'rows' | 'hasMoreData'>
        & { columns?: Maybe<Array<Maybe<(
          Pick<SqlResultColumn, 'dataKind' | 'entityName' | 'fullTypeName' | 'icon' | 'label' | 'maxLength' | 'name' | 'position' | 'precision' | 'required' | 'readOnly' | 'readOnlyStatus' | 'scale' | 'typeName'>
          & { supportedOperations: Array<Pick<DataTypeLogicalOperation, 'id' | 'expression' | 'argumentCount'>> }
        )>>>; }
      )>; }
    )>; }
  );
}

export type GetSqlExecutionPlanResultMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;

export interface GetSqlExecutionPlanResultMutation {
  result: (
    Pick<SqlExecutionPlan, 'query'>
    & { nodes: Array<(
      Pick<SqlExecutionPlanNode, 'id' | 'parentId' | 'kind' | 'name' | 'type' | 'condition' | 'description'>
      & { properties: Array<Pick<ObjectPropertyInfo, 'id' | 'category' | 'dataType' | 'description' | 'displayName' | 'features' | 'value' | 'order'>> }
    )>; }
  );
}

export type UpdateResultsDataBatchMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  deletedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  addedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
}>;

export interface UpdateResultsDataBatchMutation {
  result: (
    Pick<SqlExecuteInfo, 'duration' | 'filterText'>
    & { results: Array<(
      Pick<SqlQueryResults, 'updateRowCount'>
      & { resultSet?: Maybe<Pick<SqlResultSet, 'id' | 'rows'>> }
    )>; }
  );
}

export type UpdateResultsDataBatchScriptMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  deletedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  addedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
}>;

export interface UpdateResultsDataBatchScriptMutation { result: Mutation['updateResultsDataBatchScript'] }

export type MetadataGetNodeDdlQueryVariables = Exact<{
  nodeId: Scalars['ID'];
}>;

export type MetadataGetNodeDdlQuery = Pick<Query, 'metadataGetNodeDDL'>;

export type GetChildrenDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export interface GetChildrenDbObjectInfoQuery {
  dbObjects: Array<(
    Pick<NavigatorNodeInfo, 'id'>
    & { object?: Maybe<(
      Pick<DatabaseObjectInfo, 'features'>
      & { properties?: Maybe<Array<Maybe<NavNodePropertiesFragment>>> }
    )>; }
  )>;
}

export type GetDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export interface GetDbObjectInfoQuery {
  objectInfo: { object?: Maybe<(
    Pick<DatabaseObjectInfo, 'features'>
    & { properties?: Maybe<Array<Maybe<NavNodePropertiesFragment>>> }
  )>; };
}

export type NavNodeChildrenQueryVariables = Exact<{
  parentPath: Scalars['ID'];
  withDetails: Scalars['Boolean'];
}>;

export interface NavNodeChildrenQuery { navNodeChildren: NavNodeInfoFragment[]; navNodeInfo: NavNodeInfoFragment }

export type NavNodeInfoQueryVariables = Exact<{
  nodePath: Scalars['ID'];
  withDetails: Scalars['Boolean'];
}>;

export interface NavNodeInfoQuery { navNodeInfo: NavNodeInfoFragment }

export type NavRefreshNodeQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;

export type NavRefreshNodeQuery = Pick<Query, 'navRefreshNode'>;

export type QuerySqlCompletionProposalsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  position: Scalars['Int'];
  query: Scalars['String'];
  simple?: Maybe<Scalars['Boolean']>;
  maxResults?: Maybe<Scalars['Int']>;
}>;

export interface QuerySqlCompletionProposalsQuery { sqlCompletionProposals?: Maybe<Array<Maybe<Pick<SqlCompletionProposal, 'cursorPosition' | 'displayString' | 'icon' | 'nodePath' | 'replacementLength' | 'replacementOffset' | 'replacementString' | 'score' | 'type'>>>> }

export type QuerySqlDialectInfoQueryVariables = Exact<{
  connectionId: Scalars['ID'];
}>;

export interface QuerySqlDialectInfoQuery { dialect?: Maybe<Pick<SqlDialectInfo, 'name' | 'dataTypes' | 'functions' | 'reservedWords' | 'quoteStrings' | 'singleLineComments' | 'multiLineComments' | 'catalogSeparator' | 'structSeparator' | 'scriptDelimiter' | 'supportsExplainExecutionPlan'>> }

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

export type OpenSessionMutationVariables = Exact<{ [key: string]: never }>;

export interface OpenSessionMutation { session: SessionStateFragment }

export type ReadSessionLogQueryVariables = Exact<{
  maxEntries: Scalars['Int'];
  clearEntries: Scalars['Boolean'];
}>;

export interface ReadSessionLogQuery { log: Array<Pick<LogEntry, 'time' | 'type' | 'message' | 'stackTrace'>> }

export type ServerConfigQueryVariables = Exact<{ [key: string]: never }>;

export interface ServerConfigQuery {
  serverConfig: (
    Pick<ServerConfig, 'name' | 'version' | 'workspaceId' | 'serverURL' | 'rootURI' | 'productConfiguration' | 'supportsCustomConnections' | 'supportsConnectionBrowser' | 'supportsWorkspaces' | 'sessionExpireTime' | 'anonymousAccessEnabled' | 'adminCredentialsSaveEnabled' | 'publicCredentialsSaveEnabled' | 'licenseRequired' | 'licenseValid' | 'configurationMode' | 'developmentMode' | 'enabledAuthProviders'>
    & { supportedLanguages: Array<Pick<ServerLanguage, 'isoCode' | 'displayName' | 'nativeName'>>; defaultNavigatorSettings: AllNavigatorSettingsFragment; productInfo: Pick<ProductInfo, 'id' | 'version' | 'name' | 'description' | 'buildTime' | 'releaseTime' | 'licenseInfo'> }
  );
}

export type SessionPermissionsQueryVariables = Exact<{ [key: string]: never }>;

export interface SessionPermissionsQuery { permissions: Query['sessionPermissions'] }

export type SessionStateQueryVariables = Exact<{ [key: string]: never }>;

export interface SessionStateQuery { sessionState: SessionStateFragment }

export type TouchSessionMutationVariables = Exact<{ [key: string]: never }>;

export type TouchSessionMutation = Pick<Mutation, 'touchSession'>;

export type SqlResultCloseMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
}>;

export interface SqlResultCloseMutation { result: Mutation['sqlResultClose'] }

export const ObjectOriginInfoFragmentDoc = `
    fragment ObjectOriginInfo on ObjectOrigin {
  type
  subType
  displayName
  icon
  details @include(if: $customIncludeOriginDetails) {
    id
    displayName
    description
    category
    dataType
    defaultValue
    validValues
    value
    features
    order
  }
}
    `;
export const AdminUserInfoFragmentDoc = `
    fragment AdminUserInfo on AdminUserInfo {
  userId
  grantedRoles
  linkedAuthProviders
  origins {
    ...ObjectOriginInfo
  }
}
    ${ObjectOriginInfoFragmentDoc}`;
export const AuthTokenFragmentDoc = `
    fragment AuthToken on UserAuthToken {
  authProvider
  loginTime
  message
  origin {
    ...ObjectOriginInfo
  }
}
    ${ObjectOriginInfoFragmentDoc}`;
export const UserConnectionAuthPropertiesFragmentDoc = `
    fragment UserConnectionAuthProperties on ObjectPropertyInfo {
  id
  displayName
  description
  category
  dataType
  value
  validValues
  defaultValue
  features
  order
}
    `;
export const AllNavigatorSettingsFragmentDoc = `
    fragment AllNavigatorSettings on NavigatorSettings {
  showSystemObjects
  showUtilityObjects
  showOnlyEntities
  mergeEntities
  hideFolders
  hideSchemas
  hideVirtualModel
}
    `;
export const DatabaseConnectionFragmentDoc = `
    fragment DatabaseConnection on ConnectionInfo {
  id
  name
  description
  driverId
  template
  connected
  provided
  useUrl
  readOnly
  saveCredentials
  host
  port
  databaseName
  url
  properties
  providerProperties
  features
  supportedDataFormats
  origin @include(if: $includeOrigin) {
    ...ObjectOriginInfo
  }
  authNeeded
  authModel
  authProperties @include(if: $includeAuthProperties) {
    ...UserConnectionAuthProperties
  }
  networkHandlersConfig {
    id
    enabled
    userName @include(if: $customIncludeNetworkHandlerCredentials)
    password @include(if: $customIncludeNetworkHandlerCredentials)
    savePassword
    properties @include(if: $customIncludeNetworkHandlerCredentials)
  }
  navigatorSettings {
    ...AllNavigatorSettings
  }
}
    ${ObjectOriginInfoFragmentDoc}
${UserConnectionAuthPropertiesFragmentDoc}
${AllNavigatorSettingsFragmentDoc}`;
export const DatabaseDriverFragmentDoc = `
    fragment DatabaseDriver on DriverInfo {
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
  applicableNetworkHandlers
  providerProperties @include(if: $includeProviderProperties) {
    id
    displayName
    description
    category
    dataType
    defaultValue
    validValues
    features
    order
  }
  driverProperties @include(if: $includeDriverProperties) {
    id
    displayName
    description
    category
    dataType
    defaultValue
    validValues
  }
  driverParameters @include(if: $includeDriverParameters)
}
    `;
export const NavNodePropertiesFragmentDoc = `
    fragment NavNodeProperties on ObjectPropertyInfo {
  id
  category
  dataType
  description
  displayName
  features
  value
  order
}
    `;
export const NavNodeInfoFragmentDoc = `
    fragment NavNodeInfo on NavigatorNodeInfo {
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
  nodeDetails @include(if: $withDetails) {
    ...NavNodeProperties
  }
}
    ${NavNodePropertiesFragmentDoc}`;
export const SessionStateFragmentDoc = `
    fragment SessionState on SessionInfo {
  createTime
  lastAccessTime
  cacheExpired
  locale
}
    `;
export const UserConnectionNetworkHandlerPropertiesFragmentDoc = `
    fragment UserConnectionNetworkHandlerProperties on ObjectPropertyInfo {
  id
  displayName
  description
  category
  dataType
  value
  validValues
  defaultValue
  order
  features
}
    `;
export const AsyncTaskCancelDocument = `
    mutation asyncTaskCancel($taskId: String!) {
  result: asyncTaskCancel(id: $taskId)
}
    `;
export const AuthChangeLocalPasswordDocument = `
    query authChangeLocalPassword($oldPassword: String!, $newPassword: String!) {
  authChangeLocalPassword(oldPassword: $oldPassword, newPassword: $newPassword)
}
    `;
export const AuthLoginDocument = `
    query authLogin($provider: ID!, $credentials: Object!, $linkUser: Boolean, $customIncludeOriginDetails: Boolean!) {
  authToken: authLogin(
    provider: $provider
    credentials: $credentials
    linkUser: $linkUser
  ) {
    ...AuthToken
  }
}
    ${AuthTokenFragmentDoc}`;
export const AuthLogoutDocument = `
    query authLogout {
  authLogout
}
    `;
export const GetActiveUserDocument = `
    query getActiveUser($customIncludeOriginDetails: Boolean!) {
  user: activeUser {
    userId
    displayName
    linkedAuthProviders
    authTokens {
      ...AuthToken
    }
  }
}
    ${AuthTokenFragmentDoc}`;
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
      identifying
      possibleValues
      encryption
    }
  }
}
    `;
export const CreateUserDocument = `
    query createUser($userId: ID!, $customIncludeOriginDetails: Boolean!) {
  user: createUser(userId: $userId) {
    ...AdminUserInfo
  }
}
    ${AdminUserInfoFragmentDoc}`;
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
    description
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
    query getUsersList($userId: ID, $customIncludeOriginDetails: Boolean!) {
  users: listUsers(userId: $userId) {
    ...AdminUserInfo
  }
}
    ${AdminUserInfoFragmentDoc}`;
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
  grantedConnections: setSubjectConnectionAccess(
    subjectId: $userId
    connections: $connections
  )
}
    `;
export const SetUserCredentialsDocument = `
    query setUserCredentials($userId: ID!, $providerId: ID!, $credentials: Object!) {
  setUserCredentials(
    userId: $userId
    providerId: $providerId
    credentials: $credentials
  )
}
    `;
export const CreateConnectionConfigurationDocument = `
    query createConnectionConfiguration($config: ConnectionConfig!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: createConnectionConfiguration(config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const CreateConnectionConfigurationFromNodeDocument = `
    query createConnectionConfigurationFromNode($nodePath: String!, $config: ConnectionConfig, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: copyConnectionConfiguration(nodePath: $nodePath, config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
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
    query getConnections($id: ID, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connections: allConnections(id: $id) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const SearchDatabasesDocument = `
    query searchDatabases($hosts: [String!]!) {
  databases: searchConnections(hostNames: $hosts) {
    displayName
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
    query updateConnectionConfiguration($id: ID!, $config: ConnectionConfig!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: updateConnectionConfiguration(id: $id, config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const CloseConnectionDocument = `
    mutation closeConnection($id: ID!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: closeConnection(id: $id) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const CreateConnectionDocument = `
    mutation createConnection($config: ConnectionConfig!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: createConnection(config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const CreateConnectionFromNodeDocument = `
    mutation createConnectionFromNode($nodePath: String!, $config: ConnectionConfig, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: copyConnectionFromNode(nodePath: $nodePath, config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const CreateConnectionFromTemplateDocument = `
    mutation createConnectionFromTemplate($templateId: ID!, $connectionName: String!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: createConnectionFromTemplate(
    templateId: $templateId
    connectionName: $connectionName
  ) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const DeleteConnectionDocument = `
    mutation deleteConnection($id: ID!) {
  deleteConnection(id: $id)
}
    `;
export const DriverListDocument = `
    query driverList($driverId: ID, $includeProviderProperties: Boolean!, $includeDriverProperties: Boolean!, $includeDriverParameters: Boolean!) {
  drivers: driverList(id: $driverId) {
    ...DatabaseDriver
  }
}
    ${DatabaseDriverFragmentDoc}`;
export const ExecutionContextCreateDocument = `
    mutation executionContextCreate($connectionId: ID!, $defaultCatalog: String, $defaultSchema: String) {
  context: sqlContextCreate(
    connectionId: $connectionId
    defaultCatalog: $defaultCatalog
    defaultSchema: $defaultSchema
  ) {
    id
    connectionId
    defaultCatalog
    defaultSchema
  }
}
    `;
export const ExecutionContextDestroyDocument = `
    mutation executionContextDestroy($connectionId: ID!, $contextId: ID!) {
  sqlContextDestroy(connectionId: $connectionId, contextId: $contextId)
}
    `;
export const ExecutionContextListDocument = `
    query executionContextList($connectionId: ID, $contextId: ID) {
  contexts: sqlListContexts(connectionId: $connectionId, contextId: $contextId) {
    id
    connectionId
    defaultCatalog
    defaultSchema
  }
}
    `;
export const ExecutionContextUpdateDocument = `
    mutation executionContextUpdate($connectionId: ID!, $contextId: ID!, $defaultCatalog: ID, $defaultSchema: ID) {
  context: sqlContextSetDefaults(
    connectionId: $connectionId
    contextId: $contextId
    defaultCatalog: $defaultCatalog
    defaultSchema: $defaultSchema
  )
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
      validValues
      defaultValue
      features
      order
    }
  }
}
    `;
export const GetTemplateConnectionsDocument = `
    query getTemplateConnections($includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connections: templateConnections {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const GetUserConnectionsDocument = `
    query getUserConnections($id: ID, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connections: userConnections(id: $id) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const InitConnectionDocument = `
    mutation initConnection($id: ID!, $credentials: Object, $networkCredentials: [NetworkHandlerConfigInput!], $saveCredentials: Boolean, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: initConnection(
    id: $id
    credentials: $credentials
    networkCredentials: $networkCredentials
    saveCredentials: $saveCredentials
  ) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const RefreshSessionConnectionsDocument = `
    mutation refreshSessionConnections {
  refreshSessionConnections
}
    `;
export const SetConnectionNavigatorSettingsDocument = `
    mutation setConnectionNavigatorSettings($id: ID!, $settings: NavigatorSettingsInput!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: setConnectionNavigatorSettings(id: $id, settings: $settings) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const TestConnectionDocument = `
    mutation testConnection($config: ConnectionConfig!) {
  connection: testConnection(config: $config) {
    id
    connectTime
    connectionError {
      message
      errorCode
      stackTrace
    }
    serverVersion
    clientVersion
  }
}
    `;
export const TestNetworkHandlerDocument = `
    mutation testNetworkHandler($config: NetworkHandlerConfigInput!) {
  info: testNetworkHandler(config: $config) {
    message
    clientVersion
    serverVersion
  }
}
    `;
export const UpdateConnectionDocument = `
    mutation updateConnection($config: ConnectionConfig!, $includeOrigin: Boolean!, $customIncludeOriginDetails: Boolean!, $includeAuthProperties: Boolean!, $customIncludeNetworkHandlerCredentials: Boolean!) {
  connection: updateConnection(config: $config) {
    ...DatabaseConnection
  }
}
    ${DatabaseConnectionFragmentDoc}`;
export const ExportDataFromContainerDocument = `
    query exportDataFromContainer($connectionId: ID!, $containerNodePath: ID!, $parameters: DataTransferParameters!) {
  taskInfo: dataTransferExportDataFromContainer(
    connectionId: $connectionId
    containerNodePath: $containerNodePath
    parameters: $parameters
  ) {
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
  taskInfo: dataTransferExportDataFromResults(
    connectionId: $connectionId
    contextId: $contextId
    resultsId: $resultsId
    parameters: $parameters
  ) {
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
      order
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
export const GetNetworkHandlersDocument = `
    query getNetworkHandlers {
  handlers: networkHandlers {
    id
    codeName
    label
    description
    secured
    type
    properties {
      ...UserConnectionNetworkHandlerProperties
    }
  }
}
    ${UserConnectionNetworkHandlerPropertiesFragmentDoc}`;
export const AsyncReadDataFromContainerDocument = `
    mutation asyncReadDataFromContainer($connectionId: ID!, $contextId: ID!, $containerNodePath: ID!, $filter: SQLDataFilter, $dataFormat: ResultDataFormat) {
  taskInfo: asyncReadDataFromContainer(
    connectionId: $connectionId
    contextId: $contextId
    containerNodePath: $containerNodePath
    filter: $filter
    dataFormat: $dataFormat
  ) {
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
  taskInfo: asyncSqlExecuteQuery(
    connectionId: $connectionId
    contextId: $contextId
    sql: $query
    filter: $filter
    dataFormat: $dataFormat
  ) {
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
export const AsyncSqlExplainExecutionPlanDocument = `
    mutation asyncSqlExplainExecutionPlan($connectionId: ID!, $contextId: ID!, $query: String!, $configuration: Object!) {
  taskInfo: asyncSqlExplainExecutionPlan(
    connectionId: $connectionId
    contextId: $contextId
    query: $query
    configuration: $configuration
  ) {
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
    filterText
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
          required
          readOnly
          readOnlyStatus
          scale
          typeName
          supportedOperations {
            id
            expression
            argumentCount
          }
        }
        rows
        hasMoreData
      }
    }
  }
}
    `;
export const GetSqlExecutionPlanResultDocument = `
    mutation getSqlExecutionPlanResult($taskId: ID!) {
  result: asyncSqlExplainExecutionPlanResult(taskId: $taskId) {
    query
    nodes {
      id
      parentId
      kind
      name
      type
      condition
      description
      properties {
        id
        category
        dataType
        description
        displayName
        features
        value
        order
      }
    }
  }
}
    `;
export const UpdateResultsDataBatchDocument = `
    mutation updateResultsDataBatch($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $updatedRows: [SQLResultRow!], $deletedRows: [SQLResultRow!], $addedRows: [SQLResultRow!]) {
  result: updateResultsDataBatch(
    connectionId: $connectionId
    contextId: $contextId
    resultsId: $resultsId
    updatedRows: $updatedRows
    deletedRows: $deletedRows
    addedRows: $addedRows
  ) {
    duration
    filterText
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
export const UpdateResultsDataBatchScriptDocument = `
    mutation updateResultsDataBatchScript($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $updatedRows: [SQLResultRow!], $deletedRows: [SQLResultRow!], $addedRows: [SQLResultRow!]) {
  result: updateResultsDataBatchScript(
    connectionId: $connectionId
    contextId: $contextId
    resultsId: $resultsId
    updatedRows: $updatedRows
    deletedRows: $deletedRows
    addedRows: $addedRows
  )
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
        ...NavNodeProperties
      }
    }
  }
}
    ${NavNodePropertiesFragmentDoc}`;
export const GetDbObjectInfoDocument = `
    query getDBObjectInfo($navNodeId: ID!, $filter: ObjectPropertyFilter) {
  objectInfo: navNodeInfo(nodePath: $navNodeId) {
    object {
      features
      properties(filter: $filter) {
        ...NavNodeProperties
      }
    }
  }
}
    ${NavNodePropertiesFragmentDoc}`;
export const NavNodeChildrenDocument = `
    query navNodeChildren($parentPath: ID!, $withDetails: Boolean!) {
  navNodeChildren(parentPath: $parentPath) {
    ...NavNodeInfo
  }
  navNodeInfo(nodePath: $parentPath) {
    ...NavNodeInfo
  }
}
    ${NavNodeInfoFragmentDoc}`;
export const NavNodeInfoDocument = `
    query navNodeInfo($nodePath: ID!, $withDetails: Boolean!) {
  navNodeInfo(nodePath: $nodePath) {
    ...NavNodeInfo
  }
}
    ${NavNodeInfoFragmentDoc}`;
export const NavRefreshNodeDocument = `
    query navRefreshNode($nodePath: ID!) {
  navRefreshNode(nodePath: $nodePath)
}
    `;
export const QuerySqlCompletionProposalsDocument = `
    query querySqlCompletionProposals($connectionId: ID!, $contextId: ID!, $position: Int!, $query: String!, $simple: Boolean, $maxResults: Int) {
  sqlCompletionProposals(
    connectionId: $connectionId
    contextId: $contextId
    query: $query
    position: $position
    maxResults: $maxResults
    simpleMode: $simple
  ) {
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
    supportsExplainExecutionPlan
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
    ...SessionState
  }
}
    ${SessionStateFragmentDoc}`;
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
    workspaceId
    serverURL
    rootURI
    productConfiguration
    supportsCustomConnections
    supportsConnectionBrowser
    supportsWorkspaces
    sessionExpireTime
    anonymousAccessEnabled
    adminCredentialsSaveEnabled
    publicCredentialsSaveEnabled
    licenseRequired
    licenseValid
    configurationMode
    developmentMode
    enabledAuthProviders
    supportedLanguages {
      isoCode
      displayName
      nativeName
    }
    productConfiguration
    defaultNavigatorSettings {
      ...AllNavigatorSettings
    }
    productInfo {
      id
      version
      name
      description
      buildTime
      releaseTime
      licenseInfo
    }
  }
}
    ${AllNavigatorSettingsFragmentDoc}`;
export const SessionPermissionsDocument = `
    query sessionPermissions {
  permissions: sessionPermissions
}
    `;
export const SessionStateDocument = `
    query sessionState {
  sessionState {
    ...SessionState
  }
}
    ${SessionStateFragmentDoc}`;
export const TouchSessionDocument = `
    mutation touchSession {
  touchSession
}
    `;
export const SqlResultCloseDocument = `
    mutation sqlResultClose($connectionId: ID!, $contextId: ID!, $resultId: ID!) {
  result: sqlResultClose(
    connectionId: $connectionId
    contextId: $contextId
    resultId: $resultId
  )
}
    `;

export type SdkFunctionWrapper = <T>(action: () => Promise<T>) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = sdkFunction => sdkFunction();
export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    asyncTaskCancel(variables: AsyncTaskCancelMutationVariables): Promise<AsyncTaskCancelMutation> {
      return withWrapper(() => client.request<AsyncTaskCancelMutation>(AsyncTaskCancelDocument, variables));
    },
    authChangeLocalPassword(variables: AuthChangeLocalPasswordQueryVariables): Promise<AuthChangeLocalPasswordQuery> {
      return withWrapper(() => client.request<AuthChangeLocalPasswordQuery>(AuthChangeLocalPasswordDocument, variables));
    },
    authLogin(variables: AuthLoginQueryVariables): Promise<AuthLoginQuery> {
      return withWrapper(() => client.request<AuthLoginQuery>(AuthLoginDocument, variables));
    },
    authLogout(variables?: AuthLogoutQueryVariables): Promise<AuthLogoutQuery> {
      return withWrapper(() => client.request<AuthLogoutQuery>(AuthLogoutDocument, variables));
    },
    getActiveUser(variables: GetActiveUserQueryVariables): Promise<GetActiveUserQuery> {
      return withWrapper(() => client.request<GetActiveUserQuery>(GetActiveUserDocument, variables));
    },
    getAuthProviders(variables?: GetAuthProvidersQueryVariables): Promise<GetAuthProvidersQuery> {
      return withWrapper(() => client.request<GetAuthProvidersQuery>(GetAuthProvidersDocument, variables));
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
    getUsersList(variables: GetUsersListQueryVariables): Promise<GetUsersListQuery> {
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
    createConnectionConfigurationFromNode(variables: CreateConnectionConfigurationFromNodeQueryVariables): Promise<CreateConnectionConfigurationFromNodeQuery> {
      return withWrapper(() => client.request<CreateConnectionConfigurationFromNodeQuery>(CreateConnectionConfigurationFromNodeDocument, variables));
    },
    deleteConnectionConfiguration(variables: DeleteConnectionConfigurationQueryVariables): Promise<DeleteConnectionConfigurationQuery> {
      return withWrapper(() => client.request<DeleteConnectionConfigurationQuery>(DeleteConnectionConfigurationDocument, variables));
    },
    getConnectionAccess(variables?: GetConnectionAccessQueryVariables): Promise<GetConnectionAccessQuery> {
      return withWrapper(() => client.request<GetConnectionAccessQuery>(GetConnectionAccessDocument, variables));
    },
    getConnections(variables: GetConnectionsQueryVariables): Promise<GetConnectionsQuery> {
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
    createConnection(variables: CreateConnectionMutationVariables): Promise<CreateConnectionMutation> {
      return withWrapper(() => client.request<CreateConnectionMutation>(CreateConnectionDocument, variables));
    },
    createConnectionFromNode(variables: CreateConnectionFromNodeMutationVariables): Promise<CreateConnectionFromNodeMutation> {
      return withWrapper(() => client.request<CreateConnectionFromNodeMutation>(CreateConnectionFromNodeDocument, variables));
    },
    createConnectionFromTemplate(variables: CreateConnectionFromTemplateMutationVariables): Promise<CreateConnectionFromTemplateMutation> {
      return withWrapper(() => client.request<CreateConnectionFromTemplateMutation>(CreateConnectionFromTemplateDocument, variables));
    },
    deleteConnection(variables: DeleteConnectionMutationVariables): Promise<DeleteConnectionMutation> {
      return withWrapper(() => client.request<DeleteConnectionMutation>(DeleteConnectionDocument, variables));
    },
    driverList(variables: DriverListQueryVariables): Promise<DriverListQuery> {
      return withWrapper(() => client.request<DriverListQuery>(DriverListDocument, variables));
    },
    executionContextCreate(variables: ExecutionContextCreateMutationVariables): Promise<ExecutionContextCreateMutation> {
      return withWrapper(() => client.request<ExecutionContextCreateMutation>(ExecutionContextCreateDocument, variables));
    },
    executionContextDestroy(variables: ExecutionContextDestroyMutationVariables): Promise<ExecutionContextDestroyMutation> {
      return withWrapper(() => client.request<ExecutionContextDestroyMutation>(ExecutionContextDestroyDocument, variables));
    },
    executionContextList(variables?: ExecutionContextListQueryVariables): Promise<ExecutionContextListQuery> {
      return withWrapper(() => client.request<ExecutionContextListQuery>(ExecutionContextListDocument, variables));
    },
    executionContextUpdate(variables: ExecutionContextUpdateMutationVariables): Promise<ExecutionContextUpdateMutation> {
      return withWrapper(() => client.request<ExecutionContextUpdateMutation>(ExecutionContextUpdateDocument, variables));
    },
    getAuthModels(variables?: GetAuthModelsQueryVariables): Promise<GetAuthModelsQuery> {
      return withWrapper(() => client.request<GetAuthModelsQuery>(GetAuthModelsDocument, variables));
    },
    getTemplateConnections(variables: GetTemplateConnectionsQueryVariables): Promise<GetTemplateConnectionsQuery> {
      return withWrapper(() => client.request<GetTemplateConnectionsQuery>(GetTemplateConnectionsDocument, variables));
    },
    getUserConnections(variables: GetUserConnectionsQueryVariables): Promise<GetUserConnectionsQuery> {
      return withWrapper(() => client.request<GetUserConnectionsQuery>(GetUserConnectionsDocument, variables));
    },
    initConnection(variables: InitConnectionMutationVariables): Promise<InitConnectionMutation> {
      return withWrapper(() => client.request<InitConnectionMutation>(InitConnectionDocument, variables));
    },
    refreshSessionConnections(variables?: RefreshSessionConnectionsMutationVariables): Promise<RefreshSessionConnectionsMutation> {
      return withWrapper(() => client.request<RefreshSessionConnectionsMutation>(RefreshSessionConnectionsDocument, variables));
    },
    setConnectionNavigatorSettings(variables: SetConnectionNavigatorSettingsMutationVariables): Promise<SetConnectionNavigatorSettingsMutation> {
      return withWrapper(() => client.request<SetConnectionNavigatorSettingsMutation>(SetConnectionNavigatorSettingsDocument, variables));
    },
    testConnection(variables: TestConnectionMutationVariables): Promise<TestConnectionMutation> {
      return withWrapper(() => client.request<TestConnectionMutation>(TestConnectionDocument, variables));
    },
    testNetworkHandler(variables: TestNetworkHandlerMutationVariables): Promise<TestNetworkHandlerMutation> {
      return withWrapper(() => client.request<TestNetworkHandlerMutation>(TestNetworkHandlerDocument, variables));
    },
    updateConnection(variables: UpdateConnectionMutationVariables): Promise<UpdateConnectionMutation> {
      return withWrapper(() => client.request<UpdateConnectionMutation>(UpdateConnectionDocument, variables));
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
    getNetworkHandlers(variables?: GetNetworkHandlersQueryVariables): Promise<GetNetworkHandlersQuery> {
      return withWrapper(() => client.request<GetNetworkHandlersQuery>(GetNetworkHandlersDocument, variables));
    },
    asyncReadDataFromContainer(variables: AsyncReadDataFromContainerMutationVariables): Promise<AsyncReadDataFromContainerMutation> {
      return withWrapper(() => client.request<AsyncReadDataFromContainerMutation>(AsyncReadDataFromContainerDocument, variables));
    },
    asyncSqlExecuteQuery(variables: AsyncSqlExecuteQueryMutationVariables): Promise<AsyncSqlExecuteQueryMutation> {
      return withWrapper(() => client.request<AsyncSqlExecuteQueryMutation>(AsyncSqlExecuteQueryDocument, variables));
    },
    asyncSqlExplainExecutionPlan(variables: AsyncSqlExplainExecutionPlanMutationVariables): Promise<AsyncSqlExplainExecutionPlanMutation> {
      return withWrapper(() => client.request<AsyncSqlExplainExecutionPlanMutation>(AsyncSqlExplainExecutionPlanDocument, variables));
    },
    getSqlExecuteTaskResults(variables: GetSqlExecuteTaskResultsMutationVariables): Promise<GetSqlExecuteTaskResultsMutation> {
      return withWrapper(() => client.request<GetSqlExecuteTaskResultsMutation>(GetSqlExecuteTaskResultsDocument, variables));
    },
    getSqlExecutionPlanResult(variables: GetSqlExecutionPlanResultMutationVariables): Promise<GetSqlExecutionPlanResultMutation> {
      return withWrapper(() => client.request<GetSqlExecutionPlanResultMutation>(GetSqlExecutionPlanResultDocument, variables));
    },
    updateResultsDataBatch(variables: UpdateResultsDataBatchMutationVariables): Promise<UpdateResultsDataBatchMutation> {
      return withWrapper(() => client.request<UpdateResultsDataBatchMutation>(UpdateResultsDataBatchDocument, variables));
    },
    updateResultsDataBatchScript(variables: UpdateResultsDataBatchScriptMutationVariables): Promise<UpdateResultsDataBatchScriptMutation> {
      return withWrapper(() => client.request<UpdateResultsDataBatchScriptMutation>(UpdateResultsDataBatchScriptDocument, variables));
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
    sqlResultClose(variables: SqlResultCloseMutationVariables): Promise<SqlResultCloseMutation> {
      return withWrapper(() => client.request<SqlResultCloseMutation>(SqlResultCloseDocument, variables));
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
