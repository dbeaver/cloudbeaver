/* eslint-disable max-len */
import type { GraphQLClient } from 'graphql-request';
import type * as Dom from 'graphql-request/dist/types.dom';
export type Maybe<T> = T;
export type InputMaybe<T> = T;
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

export interface AdminAuthProviderConfiguration {
  description?: Maybe<Scalars['String']>;
  disabled: Scalars['Boolean'];
  displayName: Scalars['String'];
  iconURL?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  metadataLink?: Maybe<Scalars['String']>;
  parameters: Scalars['Object'];
  providerId: Scalars['ID'];
  redirectLink?: Maybe<Scalars['String']>;
  signInLink?: Maybe<Scalars['String']>;
  signOutLink?: Maybe<Scalars['String']>;
}

export interface AdminConnectionGrantInfo {
  /** @deprecated use dataSourceId instead */
  connectionId: Scalars['ID'];
  dataSourceId: Scalars['ID'];
  subjectId: Scalars['ID'];
  subjectType: AdminSubjectType;
}

export interface AdminConnectionSearchInfo {
  defaultDriver: Scalars['ID'];
  displayName: Scalars['String'];
  host: Scalars['String'];
  port: Scalars['Int'];
  possibleDrivers: Array<Scalars['ID']>;
}

export interface AdminPermissionInfo {
  category?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  label?: Maybe<Scalars['String']>;
  provider: Scalars['String'];
}

export interface AdminRoleInfo {
  description?: Maybe<Scalars['String']>;
  grantedConnections: Array<AdminConnectionGrantInfo>;
  grantedUsers: Array<Scalars['ID']>;
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  rolePermissions: Array<Maybe<Scalars['ID']>>;
}

export enum AdminSubjectType {
  Role = 'role',
  User = 'user'
}

export interface AdminUserInfo {
  configurationParameters: Scalars['Object'];
  enabled: Scalars['Boolean'];
  grantedConnections: Array<AdminConnectionGrantInfo>;
  grantedRoles: Array<Scalars['ID']>;
  linkedAuthProviders: Array<Scalars['String']>;
  metaParameters: Scalars['Object'];
  origins: Array<ObjectOrigin>;
  userId: Scalars['ID'];
}

export interface AsyncTaskInfo {
  error?: Maybe<ServerError>;
  id: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  /** @deprecated Field no longer supported */
  result?: Maybe<SqlExecuteInfo>;
  running: Scalars['Boolean'];
  status?: Maybe<Scalars['String']>;
  taskResult?: Maybe<Scalars['Object']>;
}

export enum AuthCredentialEncryption {
  Hash = 'hash',
  None = 'none',
  Plain = 'plain'
}

export interface AuthCredentialInfo {
  admin: Scalars['Boolean'];
  description?: Maybe<Scalars['String']>;
  displayName: Scalars['String'];
  encryption?: Maybe<AuthCredentialEncryption>;
  id: Scalars['ID'];
  identifying: Scalars['Boolean'];
  possibleValues?: Maybe<Array<Maybe<Scalars['String']>>>;
  user: Scalars['Boolean'];
}

export interface AuthProviderConfiguration {
  description?: Maybe<Scalars['String']>;
  disabled: Scalars['Boolean'];
  displayName: Scalars['String'];
  iconURL?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  metadataLink?: Maybe<Scalars['String']>;
  signInLink?: Maybe<Scalars['String']>;
  signOutLink?: Maybe<Scalars['String']>;
}

export interface AuthProviderCredentialsProfile {
  credentialParameters: Array<AuthCredentialInfo>;
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
}

export interface AuthProviderInfo {
  configurable: Scalars['Boolean'];
  configurations?: Maybe<Array<AuthProviderConfiguration>>;
  credentialProfiles: Array<AuthProviderCredentialsProfile>;
  defaultProvider: Scalars['Boolean'];
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['ID']>;
  id: Scalars['ID'];
  label: Scalars['String'];
  requiredFeatures: Array<Scalars['String']>;
}

export interface ConnectionConfig {
  authModelId?: InputMaybe<Scalars['ID']>;
  connectionId?: InputMaybe<Scalars['String']>;
  credentials?: InputMaybe<Scalars['Object']>;
  dataSourceId?: InputMaybe<Scalars['ID']>;
  databaseName?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  driverId?: InputMaybe<Scalars['ID']>;
  host?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  networkHandlersConfig?: InputMaybe<Array<NetworkHandlerConfigInput>>;
  port?: InputMaybe<Scalars['String']>;
  properties?: InputMaybe<Scalars['Object']>;
  providerProperties?: InputMaybe<Scalars['Object']>;
  readOnly?: InputMaybe<Scalars['Boolean']>;
  saveCredentials?: InputMaybe<Scalars['Boolean']>;
  serverName?: InputMaybe<Scalars['String']>;
  template?: InputMaybe<Scalars['Boolean']>;
  templateId?: InputMaybe<Scalars['ID']>;
  url?: InputMaybe<Scalars['String']>;
  userName?: InputMaybe<Scalars['String']>;
  userPassword?: InputMaybe<Scalars['String']>;
}

export interface ConnectionInfo {
  authModel?: Maybe<Scalars['ID']>;
  authNeeded: Scalars['Boolean'];
  authProperties: Array<ObjectPropertyInfo>;
  clientVersion?: Maybe<Scalars['String']>;
  connectTime?: Maybe<Scalars['String']>;
  connected: Scalars['Boolean'];
  connectionError?: Maybe<ServerError>;
  databaseName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  driverId: Scalars['ID'];
  features: Array<Scalars['String']>;
  folder?: Maybe<Scalars['String']>;
  host?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  name: Scalars['String'];
  navigatorSettings: NavigatorSettings;
  networkHandlersConfig: Array<NetworkHandlerConfig>;
  nodePath?: Maybe<Scalars['String']>;
  origin: ObjectOrigin;
  port?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  provided: Scalars['Boolean'];
  providerProperties: Scalars['Object'];
  readOnly: Scalars['Boolean'];
  saveCredentials: Scalars['Boolean'];
  serverName?: Maybe<Scalars['String']>;
  serverVersion?: Maybe<Scalars['String']>;
  supportedDataFormats: Array<ResultDataFormat>;
  template: Scalars['Boolean'];
  url?: Maybe<Scalars['String']>;
  useUrl: Scalars['Boolean'];
}

export interface DataTransferParameters {
  filter?: InputMaybe<SqlDataFilter>;
  processorId: Scalars['ID'];
  processorProperties: Scalars['Object'];
  settings?: InputMaybe<Scalars['Object']>;
}

export interface DataTransferProcessorInfo {
  appFileExtension?: Maybe<Scalars['String']>;
  appName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  fileExtension?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  isBinary?: Maybe<Scalars['Boolean']>;
  isHTML?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  order: Scalars['Int'];
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
}

export interface DataTypeLogicalOperation {
  argumentCount?: Maybe<Scalars['Int']>;
  expression: Scalars['String'];
  id: Scalars['ID'];
}

export interface DatabaseAuthModel {
  description?: Maybe<Scalars['String']>;
  displayName: Scalars['String'];
  icon?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  properties: Array<ObjectPropertyInfo>;
  requiresLocalConfiguration?: Maybe<Scalars['Boolean']>;
}

export interface DatabaseCatalog {
  catalog: NavigatorNodeInfo;
  schemaList: Array<NavigatorNodeInfo>;
}

export interface DatabaseDocument {
  contentType?: Maybe<Scalars['String']>;
  data?: Maybe<Scalars['Object']>;
  id?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
}

export interface DatabaseObjectInfo {
  description?: Maybe<Scalars['String']>;
  editors?: Maybe<Array<Scalars['String']>>;
  features?: Maybe<Array<Scalars['String']>>;
  fullyQualifiedName?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  ordinalPosition?: Maybe<Scalars['Int']>;
  overloadedName?: Maybe<Scalars['String']>;
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  state?: Maybe<Scalars['String']>;
  type?: Maybe<Scalars['String']>;
  uniqueName?: Maybe<Scalars['String']>;
}


export interface DatabaseObjectInfoPropertiesArgs {
  filter?: InputMaybe<ObjectPropertyFilter>;
}

export interface DatabaseStructContainers {
  catalogList: Array<DatabaseCatalog>;
  schemaList: Array<NavigatorNodeInfo>;
  supportsCatalogChange: Scalars['Boolean'];
  supportsSchemaChange: Scalars['Boolean'];
}

export interface DriverInfo {
  /** @deprecated Field no longer supported */
  allowsEmptyPassword?: Maybe<Scalars['Boolean']>;
  anonymousAccess?: Maybe<Scalars['Boolean']>;
  applicableAuthModels: Array<Scalars['ID']>;
  applicableNetworkHandlers: Array<Maybe<Scalars['ID']>>;
  custom?: Maybe<Scalars['Boolean']>;
  defaultAuthModel: Scalars['ID'];
  defaultDatabase?: Maybe<Scalars['String']>;
  defaultHost?: Maybe<Scalars['String']>;
  defaultPort?: Maybe<Scalars['String']>;
  defaultServer?: Maybe<Scalars['String']>;
  defaultUser?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  driverClassName?: Maybe<Scalars['String']>;
  driverInfoURL?: Maybe<Scalars['String']>;
  driverParameters: Scalars['Object'];
  driverProperties: Array<ObjectPropertyInfo>;
  driverPropertiesURL?: Maybe<Scalars['String']>;
  embedded?: Maybe<Scalars['Boolean']>;
  enabled: Scalars['Boolean'];
  icon?: Maybe<Scalars['String']>;
  iconBig?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  license?: Maybe<Scalars['String']>;
  licenseRequired?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  promotedScore?: Maybe<Scalars['Int']>;
  providerId?: Maybe<Scalars['ID']>;
  providerProperties: Array<ObjectPropertyInfo>;
  requiresServerName?: Maybe<Scalars['Boolean']>;
  sampleURL?: Maybe<Scalars['String']>;
}

export interface LogEntry {
  message?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
  time?: Maybe<Scalars['DateTime']>;
  type: Scalars['String'];
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
  navDeleteNodes?: Maybe<Scalars['Int']>;
  navRenameNode?: Maybe<Scalars['String']>;
  /** @deprecated Field no longer supported */
  openConnection: ConnectionInfo;
  openSession: SessionInfo;
  readLobValue: Scalars['String'];
  refreshSessionConnections?: Maybe<Scalars['Boolean']>;
  rmCreateResource: Scalars['String'];
  rmDeleteResource?: Maybe<Scalars['Boolean']>;
  rmMoveResource: Scalars['String'];
  rmWriteResourceStringContent: Scalars['String'];
  setConnectionNavigatorSettings: ConnectionInfo;
  setUserConfigurationParameter: Scalars['Boolean'];
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
  containerNodePath: Scalars['ID'];
  contextId: Scalars['ID'];
  dataFormat?: InputMaybe<ResultDataFormat>;
  filter?: InputMaybe<SqlDataFilter>;
  resultId?: InputMaybe<Scalars['ID']>;
}


export interface MutationAsyncSqlExecuteQueryArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  dataFormat?: InputMaybe<ResultDataFormat>;
  filter?: InputMaybe<SqlDataFilter>;
  resultId?: InputMaybe<Scalars['ID']>;
  sql: Scalars['String'];
}


export interface MutationAsyncSqlExecuteResultsArgs {
  taskId: Scalars['ID'];
}


export interface MutationAsyncSqlExplainExecutionPlanArgs {
  configuration: Scalars['Object'];
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
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
  locale?: InputMaybe<Scalars['String']>;
}


export interface MutationCloseConnectionArgs {
  id: Scalars['ID'];
}


export interface MutationCopyConnectionFromNodeArgs {
  config?: InputMaybe<ConnectionConfig>;
  nodePath: Scalars['String'];
}


export interface MutationCreateConnectionArgs {
  config: ConnectionConfig;
}


export interface MutationCreateConnectionFromTemplateArgs {
  connectionName?: InputMaybe<Scalars['String']>;
  templateId: Scalars['ID'];
}


export interface MutationDeleteConnectionArgs {
  id: Scalars['ID'];
}


export interface MutationInitConnectionArgs {
  credentials?: InputMaybe<Scalars['Object']>;
  id: Scalars['ID'];
  networkCredentials?: InputMaybe<Array<NetworkHandlerConfigInput>>;
  saveCredentials?: InputMaybe<Scalars['Boolean']>;
}


export interface MutationNavDeleteNodesArgs {
  nodePaths: Array<Scalars['ID']>;
}


export interface MutationNavRenameNodeArgs {
  newName: Scalars['String'];
  nodePath: Scalars['ID'];
}


export interface MutationOpenConnectionArgs {
  config: ConnectionConfig;
}


export interface MutationOpenSessionArgs {
  defaultLocale?: InputMaybe<Scalars['String']>;
}


export interface MutationReadLobValueArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  lobColumnIndex: Scalars['Int'];
  resultsId: Scalars['ID'];
  row: Array<SqlResultRow>;
}


export interface MutationRmCreateResourceArgs {
  isFolder: Scalars['Boolean'];
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
}


export interface MutationRmDeleteResourceArgs {
  projectId: Scalars['String'];
  recursive: Scalars['Boolean'];
  resourcePath: Scalars['String'];
}


export interface MutationRmMoveResourceArgs {
  newResourcePath?: InputMaybe<Scalars['String']>;
  oldResourcePath: Scalars['String'];
  projectId: Scalars['String'];
}


export interface MutationRmWriteResourceStringContentArgs {
  data: Scalars['String'];
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
}


export interface MutationSetConnectionNavigatorSettingsArgs {
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
}


export interface MutationSetUserConfigurationParameterArgs {
  name: Scalars['String'];
  value?: InputMaybe<Scalars['Object']>;
}


export interface MutationSqlContextCreateArgs {
  connectionId: Scalars['ID'];
  defaultCatalog?: InputMaybe<Scalars['String']>;
  defaultSchema?: InputMaybe<Scalars['String']>;
}


export interface MutationSqlContextDestroyArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}


export interface MutationSqlContextSetDefaultsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: InputMaybe<Scalars['ID']>;
  defaultSchema?: InputMaybe<Scalars['ID']>;
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
  addedRows?: InputMaybe<Array<SqlResultRow>>;
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  deletedRows?: InputMaybe<Array<SqlResultRow>>;
  resultsId: Scalars['ID'];
  updatedRows?: InputMaybe<Array<SqlResultRow>>;
}


export interface MutationUpdateResultsDataBatchScriptArgs {
  addedRows?: InputMaybe<Array<SqlResultRow>>;
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  deletedRows?: InputMaybe<Array<SqlResultRow>>;
  resultsId: Scalars['ID'];
  updatedRows?: InputMaybe<Array<SqlResultRow>>;
}

export interface NavigatorNodeInfo {
  description?: Maybe<Scalars['String']>;
  features?: Maybe<Array<Scalars['String']>>;
  folder?: Maybe<Scalars['Boolean']>;
  fullName?: Maybe<Scalars['String']>;
  hasChildren?: Maybe<Scalars['Boolean']>;
  icon?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  inline?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  navigable?: Maybe<Scalars['Boolean']>;
  nodeDetails?: Maybe<Array<ObjectPropertyInfo>>;
  nodeType?: Maybe<Scalars['String']>;
  object?: Maybe<DatabaseObjectInfo>;
}

export interface NavigatorSettings {
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
}

export interface NavigatorSettingsInput {
  hideFolders: Scalars['Boolean'];
  hideSchemas: Scalars['Boolean'];
  hideVirtualModel: Scalars['Boolean'];
  mergeEntities: Scalars['Boolean'];
  showOnlyEntities: Scalars['Boolean'];
  showSystemObjects: Scalars['Boolean'];
  showUtilityObjects: Scalars['Boolean'];
}

export interface NetworkEndpointInfo {
  clientVersion?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  serverVersion?: Maybe<Scalars['String']>;
}

export enum NetworkHandlerAuthType {
  Agent = 'AGENT',
  Password = 'PASSWORD',
  PublicKey = 'PUBLIC_KEY'
}

export interface NetworkHandlerConfig {
  authType: NetworkHandlerAuthType;
  enabled: Scalars['Boolean'];
  id: Scalars['ID'];
  key?: Maybe<Scalars['String']>;
  password?: Maybe<Scalars['String']>;
  properties: Scalars['Object'];
  savePassword: Scalars['Boolean'];
  userName?: Maybe<Scalars['String']>;
}

export interface NetworkHandlerConfigInput {
  authType?: InputMaybe<NetworkHandlerAuthType>;
  enabled?: InputMaybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  key?: InputMaybe<Scalars['String']>;
  password?: InputMaybe<Scalars['String']>;
  properties?: InputMaybe<Scalars['Object']>;
  savePassword?: InputMaybe<Scalars['Boolean']>;
  userName?: InputMaybe<Scalars['String']>;
}

export interface NetworkHandlerDescriptor {
  codeName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  label: Scalars['String'];
  properties: Array<ObjectPropertyInfo>;
  secured: Scalars['Boolean'];
  type?: Maybe<NetworkHandlerType>;
}

export enum NetworkHandlerType {
  Config = 'CONFIG',
  Proxy = 'PROXY',
  Tunnel = 'TUNNEL'
}

export interface ObjectDescriptor {
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  fullName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['Int']>;
  uniqueName?: Maybe<Scalars['String']>;
  value?: Maybe<Scalars['String']>;
}

export interface ObjectDetails {
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['Int']>;
  value?: Maybe<Scalars['Object']>;
}

export interface ObjectOrigin {
  configuration?: Maybe<Scalars['Object']>;
  details?: Maybe<Array<ObjectPropertyInfo>>;
  displayName: Scalars['String'];
  icon?: Maybe<Scalars['String']>;
  subType?: Maybe<Scalars['ID']>;
  type: Scalars['ID'];
}

export interface ObjectPropertyFilter {
  categories?: InputMaybe<Array<Scalars['String']>>;
  dataTypes?: InputMaybe<Array<Scalars['String']>>;
  features?: InputMaybe<Array<Scalars['String']>>;
  ids?: InputMaybe<Array<Scalars['String']>>;
}

export interface ObjectPropertyInfo {
  category?: Maybe<Scalars['String']>;
  dataType?: Maybe<Scalars['String']>;
  defaultValue?: Maybe<Scalars['Object']>;
  description?: Maybe<Scalars['String']>;
  displayName?: Maybe<Scalars['String']>;
  features: Array<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  length: ObjectPropertyLength;
  order: Scalars['Int'];
  validValues?: Maybe<Array<Maybe<Scalars['Object']>>>;
  value?: Maybe<Scalars['Object']>;
}

export enum ObjectPropertyLength {
  Long = 'LONG',
  Medium = 'MEDIUM',
  Multiline = 'MULTILINE',
  Short = 'SHORT',
  Tiny = 'TINY'
}

export interface ProductInfo {
  buildTime: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  latestVersionInfo?: Maybe<Scalars['String']>;
  licenseInfo?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  releaseTime: Scalars['String'];
  version: Scalars['String'];
}

export interface Query {
  activeUser?: Maybe<UserInfo>;
  allConnections: Array<ConnectionInfo>;
  authChangeLocalPassword: Scalars['Boolean'];
  authLogin: UserAuthToken;
  authLogout?: Maybe<Scalars['Boolean']>;
  authModels: Array<DatabaseAuthModel>;
  authProviders: Array<AuthProviderInfo>;
  configureServer: Scalars['Boolean'];
  connectionInfo: ConnectionInfo;
  /** @deprecated Field no longer supported */
  connectionState: ConnectionInfo;
  copyConnectionConfiguration: ConnectionInfo;
  createConnectionConfiguration: ConnectionInfo;
  createRole: AdminRoleInfo;
  createUser: AdminUserInfo;
  dataTransferAvailableStreamProcessors: Array<DataTransferProcessorInfo>;
  dataTransferExportDataFromContainer: AsyncTaskInfo;
  dataTransferExportDataFromResults: AsyncTaskInfo;
  dataTransferRemoveDataFile?: Maybe<Scalars['Boolean']>;
  deleteAuthProviderConfiguration: Scalars['Boolean'];
  deleteConnectionConfiguration?: Maybe<Scalars['Boolean']>;
  deleteRole?: Maybe<Scalars['Boolean']>;
  deleteUser?: Maybe<Scalars['Boolean']>;
  deleteUserMetaParameter: Scalars['Boolean'];
  driverList: Array<DriverInfo>;
  enableUser?: Maybe<Scalars['Boolean']>;
  getConnectionSubjectAccess: Array<AdminConnectionGrantInfo>;
  getSubjectConnectionAccess: Array<AdminConnectionGrantInfo>;
  grantUserRole?: Maybe<Scalars['Boolean']>;
  listAuthProviderConfigurationParameters: Array<ObjectPropertyInfo>;
  listAuthProviderConfigurations: Array<AdminAuthProviderConfiguration>;
  listFeatureSets: Array<WebFeatureSet>;
  listPermissions: Array<Maybe<AdminPermissionInfo>>;
  listRoles: Array<Maybe<AdminRoleInfo>>;
  listUserProfileProperties: Array<ObjectPropertyInfo>;
  listUsers: Array<Maybe<AdminUserInfo>>;
  metadataGetNodeDDL?: Maybe<Scalars['String']>;
  navGetStructContainers: DatabaseStructContainers;
  navNodeChildren: Array<NavigatorNodeInfo>;
  navNodeInfo: NavigatorNodeInfo;
  navNodeParents: Array<NavigatorNodeInfo>;
  navRefreshNode?: Maybe<Scalars['Boolean']>;
  networkHandlers: Array<NetworkHandlerDescriptor>;
  readSessionLog: Array<LogEntry>;
  revokeUserRole?: Maybe<Scalars['Boolean']>;
  rmListProjects: Array<RmProject>;
  rmListResources: Array<RmResource>;
  rmReadResourceAsString: Scalars['String'];
  saveAuthProviderConfiguration: AdminAuthProviderConfiguration;
  saveUserMetaParameter: ObjectPropertyInfo;
  searchConnections: Array<AdminConnectionSearchInfo>;
  serverConfig: ServerConfig;
  sessionPermissions: Array<Maybe<Scalars['ID']>>;
  sessionState: SessionInfo;
  setConnectionSubjectAccess?: Maybe<Scalars['Boolean']>;
  setDefaultNavigatorSettings: Scalars['Boolean'];
  setSubjectConnectionAccess?: Maybe<Scalars['Boolean']>;
  setSubjectPermissions?: Maybe<Scalars['Boolean']>;
  setUserCredentials?: Maybe<Scalars['Boolean']>;
  setUserMetaParameterValues: Scalars['Boolean'];
  sqlCompletionProposals?: Maybe<Array<Maybe<SqlCompletionProposal>>>;
  sqlDialectInfo?: Maybe<SqlDialectInfo>;
  sqlEntityQueryGenerators: Array<SqlQueryGenerator>;
  sqlFormatQuery: Scalars['String'];
  sqlGenerateEntityQuery: Scalars['String'];
  sqlListContexts: Array<Maybe<SqlContextInfo>>;
  sqlParseQuery: SqlScriptQuery;
  sqlParseScript: SqlScriptInfo;
  sqlSupportedOperations: Array<DataTypeLogicalOperation>;
  templateConnections: Array<ConnectionInfo>;
  tryFederatedLogin: UserAuthToken;
  updateConnectionConfiguration: ConnectionInfo;
  updateRole: AdminRoleInfo;
  userConnections: Array<ConnectionInfo>;
}


export interface QueryAllConnectionsArgs {
  id?: InputMaybe<Scalars['ID']>;
}


export interface QueryAuthChangeLocalPasswordArgs {
  newPassword: Scalars['String'];
  oldPassword: Scalars['String'];
}


export interface QueryAuthLoginArgs {
  configuration?: InputMaybe<Scalars['ID']>;
  credentials: Scalars['Object'];
  linkUser?: InputMaybe<Scalars['Boolean']>;
  provider: Scalars['ID'];
}


export interface QueryAuthLogoutArgs {
  configuration?: InputMaybe<Scalars['ID']>;
  provider?: InputMaybe<Scalars['ID']>;
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
  config?: InputMaybe<ConnectionConfig>;
  nodePath: Scalars['String'];
}


export interface QueryCreateConnectionConfigurationArgs {
  config: ConnectionConfig;
}


export interface QueryCreateRoleArgs {
  description?: InputMaybe<Scalars['String']>;
  roleId: Scalars['ID'];
  roleName?: InputMaybe<Scalars['String']>;
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
  parameters: DataTransferParameters;
  resultsId: Scalars['ID'];
}


export interface QueryDataTransferRemoveDataFileArgs {
  dataFileId: Scalars['String'];
}


export interface QueryDeleteAuthProviderConfigurationArgs {
  id: Scalars['ID'];
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


export interface QueryDeleteUserMetaParameterArgs {
  id: Scalars['ID'];
}


export interface QueryDriverListArgs {
  id?: InputMaybe<Scalars['ID']>;
}


export interface QueryEnableUserArgs {
  enabled: Scalars['Boolean'];
  userId: Scalars['ID'];
}


export interface QueryGetConnectionSubjectAccessArgs {
  connectionId?: InputMaybe<Scalars['ID']>;
}


export interface QueryGetSubjectConnectionAccessArgs {
  subjectId?: InputMaybe<Scalars['ID']>;
}


export interface QueryGrantUserRoleArgs {
  roleId: Scalars['ID'];
  userId: Scalars['ID'];
}


export interface QueryListAuthProviderConfigurationParametersArgs {
  providerId: Scalars['ID'];
}


export interface QueryListAuthProviderConfigurationsArgs {
  providerId?: InputMaybe<Scalars['ID']>;
}


export interface QueryListRolesArgs {
  roleId?: InputMaybe<Scalars['ID']>;
}


export interface QueryListUsersArgs {
  userId?: InputMaybe<Scalars['ID']>;
}


export interface QueryMetadataGetNodeDdlArgs {
  nodeId: Scalars['ID'];
  options?: InputMaybe<Scalars['Object']>;
}


export interface QueryNavGetStructContainersArgs {
  catalog?: InputMaybe<Scalars['ID']>;
  connectionId: Scalars['ID'];
  contextId?: InputMaybe<Scalars['ID']>;
}


export interface QueryNavNodeChildrenArgs {
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Int']>;
  onlyFolders?: InputMaybe<Scalars['Boolean']>;
  parentPath: Scalars['ID'];
}


export interface QueryNavNodeInfoArgs {
  nodePath: Scalars['ID'];
}


export interface QueryNavNodeParentsArgs {
  nodePath: Scalars['ID'];
}


export interface QueryNavRefreshNodeArgs {
  nodePath: Scalars['ID'];
}


export interface QueryReadSessionLogArgs {
  clearEntries?: InputMaybe<Scalars['Boolean']>;
  maxEntries?: InputMaybe<Scalars['Int']>;
}


export interface QueryRevokeUserRoleArgs {
  roleId: Scalars['ID'];
  userId: Scalars['ID'];
}


export interface QueryRmListResourcesArgs {
  folder?: InputMaybe<Scalars['String']>;
  nameMask?: InputMaybe<Scalars['String']>;
  projectId: Scalars['String'];
  readHistory?: InputMaybe<Scalars['Boolean']>;
  readProperties?: InputMaybe<Scalars['Boolean']>;
}


export interface QueryRmReadResourceAsStringArgs {
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
}


export interface QuerySaveAuthProviderConfigurationArgs {
  description?: InputMaybe<Scalars['String']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  displayName?: InputMaybe<Scalars['String']>;
  iconURL?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
  parameters?: InputMaybe<Scalars['Object']>;
  providerId: Scalars['ID'];
}


export interface QuerySaveUserMetaParameterArgs {
  description?: InputMaybe<Scalars['String']>;
  displayName: Scalars['String'];
  id: Scalars['ID'];
  required: Scalars['Boolean'];
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
  connections: Array<Scalars['ID']>;
  subjectId: Scalars['ID'];
}


export interface QuerySetSubjectPermissionsArgs {
  permissions: Array<Scalars['ID']>;
  roleId: Scalars['ID'];
}


export interface QuerySetUserCredentialsArgs {
  credentials: Scalars['Object'];
  providerId: Scalars['ID'];
  userId: Scalars['ID'];
}


export interface QuerySetUserMetaParameterValuesArgs {
  parameters: Scalars['Object'];
  userId: Scalars['ID'];
}


export interface QuerySqlCompletionProposalsArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  maxResults?: InputMaybe<Scalars['Int']>;
  position: Scalars['Int'];
  query: Scalars['String'];
  simpleMode?: InputMaybe<Scalars['Boolean']>;
}


export interface QuerySqlDialectInfoArgs {
  connectionId: Scalars['ID'];
}


export interface QuerySqlEntityQueryGeneratorsArgs {
  nodePathList: Array<Scalars['String']>;
}


export interface QuerySqlFormatQueryArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
}


export interface QuerySqlGenerateEntityQueryArgs {
  generatorId: Scalars['String'];
  nodePathList: Array<Scalars['String']>;
  options: Scalars['Object'];
}


export interface QuerySqlListContextsArgs {
  connectionId?: InputMaybe<Scalars['ID']>;
  contextId?: InputMaybe<Scalars['ID']>;
}


export interface QuerySqlParseQueryArgs {
  connectionId: Scalars['ID'];
  position: Scalars['Int'];
  script: Scalars['String'];
}


export interface QuerySqlParseScriptArgs {
  connectionId: Scalars['ID'];
  script: Scalars['String'];
}


export interface QuerySqlSupportedOperationsArgs {
  attributeIndex: Scalars['Int'];
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
}


export interface QueryTryFederatedLoginArgs {
  provider: Scalars['ID'];
}


export interface QueryUpdateConnectionConfigurationArgs {
  config: ConnectionConfig;
  id: Scalars['ID'];
}


export interface QueryUpdateRoleArgs {
  description?: InputMaybe<Scalars['String']>;
  roleId: Scalars['ID'];
  roleName?: InputMaybe<Scalars['String']>;
}


export interface QueryUserConnectionsArgs {
  id?: InputMaybe<Scalars['ID']>;
}

export interface RmProject {
  createTime: Scalars['DateTime'];
  creator: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  name: Scalars['String'];
  shared: Scalars['Boolean'];
}

export interface RmResource {
  folder: Scalars['Boolean'];
  length: Scalars['Int'];
  name: Scalars['String'];
}

export enum ResultDataFormat {
  Document = 'document',
  Graph = 'graph',
  Resultset = 'resultset',
  Timeseries = 'timeseries'
}

export interface SqlCompletionProposal {
  cursorPosition?: Maybe<Scalars['Int']>;
  displayString: Scalars['String'];
  icon?: Maybe<Scalars['String']>;
  nodePath?: Maybe<Scalars['String']>;
  replacementLength: Scalars['Int'];
  replacementOffset: Scalars['Int'];
  replacementString: Scalars['String'];
  score?: Maybe<Scalars['Int']>;
  type: Scalars['String'];
}

export interface SqlContextInfo {
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
}

export interface SqlDataFilter {
  constraints?: InputMaybe<Array<InputMaybe<SqlDataFilterConstraint>>>;
  limit?: InputMaybe<Scalars['Int']>;
  offset?: InputMaybe<Scalars['Float']>;
  orderBy?: InputMaybe<Scalars['String']>;
  where?: InputMaybe<Scalars['String']>;
}

export interface SqlDataFilterConstraint {
  attributePosition: Scalars['Int'];
  criteria?: InputMaybe<Scalars['String']>;
  operator?: InputMaybe<Scalars['String']>;
  orderAsc?: InputMaybe<Scalars['Boolean']>;
  orderPosition?: InputMaybe<Scalars['Int']>;
  value?: InputMaybe<Scalars['Object']>;
}

export interface SqlDialectInfo {
  catalogSeparator?: Maybe<Scalars['String']>;
  dataTypes: Array<Maybe<Scalars['String']>>;
  functions: Array<Maybe<Scalars['String']>>;
  multiLineComments: Array<Maybe<Array<Maybe<Scalars['String']>>>>;
  name: Scalars['String'];
  quoteStrings: Array<Maybe<Array<Maybe<Scalars['String']>>>>;
  reservedWords: Array<Maybe<Scalars['String']>>;
  scriptDelimiter?: Maybe<Scalars['String']>;
  singleLineComments: Array<Maybe<Scalars['String']>>;
  structSeparator?: Maybe<Scalars['String']>;
  supportsExplainExecutionPlan: Scalars['Boolean'];
}

export interface SqlExecuteInfo {
  duration: Scalars['Int'];
  filterText?: Maybe<Scalars['String']>;
  results: Array<SqlQueryResults>;
  statusMessage?: Maybe<Scalars['String']>;
}

export interface SqlExecutionPlan {
  nodes: Array<SqlExecutionPlanNode>;
  query: Scalars['String'];
}

export interface SqlExecutionPlanNode {
  condition?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  kind: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  parentId?: Maybe<Scalars['ID']>;
  properties: Array<ObjectPropertyInfo>;
  type: Scalars['String'];
}

export interface SqlQueryGenerator {
  description?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  label: Scalars['String'];
  multiObject: Scalars['Boolean'];
  order: Scalars['Int'];
}

export interface SqlQueryResults {
  dataFormat?: Maybe<ResultDataFormat>;
  resultSet?: Maybe<SqlResultSet>;
  sourceQuery?: Maybe<Scalars['String']>;
  title?: Maybe<Scalars['String']>;
  updateRowCount?: Maybe<Scalars['Float']>;
}

export interface SqlResultColumn {
  dataKind?: Maybe<Scalars['String']>;
  entityName?: Maybe<Scalars['String']>;
  fullTypeName?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
  maxLength?: Maybe<Scalars['Float']>;
  name?: Maybe<Scalars['String']>;
  position: Scalars['Int'];
  precision?: Maybe<Scalars['Int']>;
  readOnly: Scalars['Boolean'];
  readOnlyStatus?: Maybe<Scalars['String']>;
  required: Scalars['Boolean'];
  scale?: Maybe<Scalars['Int']>;
  supportedOperations: Array<DataTypeLogicalOperation>;
  typeName?: Maybe<Scalars['String']>;
}

export interface SqlResultRow {
  data: Array<InputMaybe<Scalars['Object']>>;
  updateValues?: InputMaybe<Scalars['Object']>;
}

export interface SqlResultSet {
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  hasMoreData: Scalars['Boolean'];
  id: Scalars['ID'];
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars['Object']>>>>>;
  singleEntity: Scalars['Boolean'];
}

export interface SqlScriptInfo {
  queries: Array<SqlScriptQuery>;
}

export interface SqlScriptQuery {
  end: Scalars['Int'];
  start: Scalars['Int'];
}

export interface ServerConfig {
  adminCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  configurationMode?: Maybe<Scalars['Boolean']>;
  defaultNavigatorSettings: NavigatorSettings;
  developmentMode?: Maybe<Scalars['Boolean']>;
  disabledDrivers: Array<Scalars['ID']>;
  enabledAuthProviders: Array<Scalars['ID']>;
  enabledFeatures: Array<Scalars['ID']>;
  hostName: Scalars['String'];
  licenseRequired: Scalars['Boolean'];
  licenseValid: Scalars['Boolean'];
  localHostAddress?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  productConfiguration: Scalars['Object'];
  productInfo: ProductInfo;
  publicCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  redirectOnFederatedAuth?: Maybe<Scalars['Boolean']>;
  resourceManagerEnabled?: Maybe<Scalars['Boolean']>;
  resourceQuotas: Scalars['Object'];
  rootURI: Scalars['String'];
  serverURL: Scalars['String'];
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  sessionExpireTime?: Maybe<Scalars['Int']>;
  supportedLanguages: Array<ServerLanguage>;
  supportsConnectionBrowser?: Maybe<Scalars['Boolean']>;
  supportsCustomConnections?: Maybe<Scalars['Boolean']>;
  supportsWorkspaces?: Maybe<Scalars['Boolean']>;
  version: Scalars['String'];
  workspaceId: Scalars['ID'];
}

export interface ServerConfigInput {
  adminCredentialsSaveEnabled?: InputMaybe<Scalars['Boolean']>;
  adminName?: InputMaybe<Scalars['String']>;
  adminPassword?: InputMaybe<Scalars['String']>;
  anonymousAccessEnabled?: InputMaybe<Scalars['Boolean']>;
  authenticationEnabled?: InputMaybe<Scalars['Boolean']>;
  customConnectionsEnabled?: InputMaybe<Scalars['Boolean']>;
  disabledDrivers?: InputMaybe<Array<Scalars['ID']>>;
  enabledAuthProviders?: InputMaybe<Array<Scalars['ID']>>;
  enabledFeatures?: InputMaybe<Array<Scalars['ID']>>;
  publicCredentialsSaveEnabled?: InputMaybe<Scalars['Boolean']>;
  resourceManagerEnabled?: InputMaybe<Scalars['Boolean']>;
  serverName?: InputMaybe<Scalars['String']>;
  serverURL?: InputMaybe<Scalars['String']>;
  sessionExpireTime?: InputMaybe<Scalars['Int']>;
}

export interface ServerError {
  causedBy?: Maybe<ServerError>;
  errorCode?: Maybe<Scalars['String']>;
  errorType?: Maybe<Scalars['String']>;
  message?: Maybe<Scalars['String']>;
  stackTrace?: Maybe<Scalars['String']>;
}

export interface ServerLanguage {
  displayName?: Maybe<Scalars['String']>;
  isoCode: Scalars['String'];
  nativeName?: Maybe<Scalars['String']>;
}

export interface ServerMessage {
  message?: Maybe<Scalars['String']>;
  time?: Maybe<Scalars['String']>;
}

export interface SessionInfo {
  actionParameters?: Maybe<Scalars['Object']>;
  cacheExpired: Scalars['Boolean'];
  connections: Array<ConnectionInfo>;
  createTime: Scalars['String'];
  lastAccessTime: Scalars['String'];
  locale: Scalars['String'];
  serverMessages?: Maybe<Array<Maybe<ServerMessage>>>;
}

export interface UserAuthToken {
  authConfiguration?: Maybe<Scalars['ID']>;
  authProvider: Scalars['ID'];
  displayName: Scalars['String'];
  loginTime: Scalars['DateTime'];
  message?: Maybe<Scalars['String']>;
  origin: ObjectOrigin;
  userId: Scalars['String'];
}

export interface UserInfo {
  authTokens: Array<UserAuthToken>;
  configurationParameters: Scalars['Object'];
  displayName?: Maybe<Scalars['String']>;
  linkedAuthProviders: Array<Scalars['String']>;
  metaParameters: Scalars['Object'];
  userId: Scalars['ID'];
}

export interface WebFeatureSet {
  description?: Maybe<Scalars['String']>;
  enabled: Scalars['Boolean'];
  icon?: Maybe<Scalars['String']>;
  id: Scalars['String'];
  label: Scalars['String'];
}

export interface WebServiceConfig {
  bundleVersion: Scalars['String'];
  description: Scalars['String'];
  id: Scalars['String'];
  name: Scalars['String'];
}

export type AsyncTaskCancelMutationVariables = Exact<{
  taskId: Scalars['String'];
}>;


export type AsyncTaskCancelMutation = { result?: boolean };

export type CreateRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
  roleName?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
}>;


export type CreateRoleQuery = { role: { roleId: string; roleName?: string; description?: string } };

export type DeleteRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
}>;


export type DeleteRoleQuery = { deleteRole?: boolean };

export type GetRoleGrantedUsersQueryVariables = Exact<{
  roleId: Scalars['ID'];
}>;


export type GetRoleGrantedUsersQuery = { role: Array<{ grantedUsers: Array<string> }> };

export type GetRolesListQueryVariables = Exact<{
  roleId?: InputMaybe<Scalars['ID']>;
}>;


export type GetRolesListQuery = { roles: Array<{ roleId: string; roleName?: string; description?: string }> };

export type UpdateRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
  roleName?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
}>;


export type UpdateRoleQuery = { role: { roleId: string; roleName?: string; description?: string } };

export type AuthChangeLocalPasswordQueryVariables = Exact<{
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
}>;


export type AuthChangeLocalPasswordQuery = { authChangeLocalPassword: boolean };

export type AuthLoginQueryVariables = Exact<{
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
  linkUser?: InputMaybe<Scalars['Boolean']>;
  customIncludeOriginDetails: Scalars['Boolean'];
}>;


export type AuthLoginQuery = { authToken: { authProvider: string; authConfiguration?: string; loginTime: any; message?: string; origin: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> } } };

export type AuthLogoutQueryVariables = Exact<{ [key: string]: never }>;


export type AuthLogoutQuery = { authLogout?: boolean };

export type DeleteAuthProviderConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteAuthProviderConfigurationQuery = { deleteAuthProviderConfiguration: boolean };

export type GetActiveUserQueryVariables = Exact<{
  includeMetaParameters: Scalars['Boolean'];
  includeConfigurationParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;


export type GetActiveUserQuery = { user?: { userId: string; displayName?: string; linkedAuthProviders: Array<string>; metaParameters?: any; configurationParameters?: any; authTokens: Array<{ authProvider: string; authConfiguration?: string; loginTime: any; message?: string; origin: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> } }> } };

export type GetAuthProviderConfigurationParametersQueryVariables = Exact<{
  providerId: Scalars['ID'];
}>;


export type GetAuthProviderConfigurationParametersQuery = { parameters: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> };

export type GetAuthProviderConfigurationsQueryVariables = Exact<{
  providerId?: InputMaybe<Scalars['ID']>;
}>;


export type GetAuthProviderConfigurationsQuery = { configurations: Array<{ providerId: string; id: string; displayName: string; disabled: boolean; iconURL?: string; description?: string; parameters: any; signInLink?: string; signOutLink?: string; redirectLink?: string; metadataLink?: string }> };

export type GetAuthProvidersQueryVariables = Exact<{ [key: string]: never }>;


export type GetAuthProvidersQuery = { providers: Array<{ id: string; label: string; icon?: string; description?: string; defaultProvider: boolean; configurable: boolean; requiredFeatures: Array<string>; configurations?: Array<{ id: string; displayName: string; iconURL?: string; description?: string; signInLink?: string; signOutLink?: string; metadataLink?: string }>; credentialProfiles: Array<{ id?: string; label?: string; description?: string; credentialParameters: Array<{ id: string; displayName: string; description?: string; admin: boolean; user: boolean; identifying: boolean; possibleValues?: Array<string>; encryption?: AuthCredentialEncryption }> }> }> };

export type GetUserProfilePropertiesQueryVariables = Exact<{ [key: string]: never }>;


export type GetUserProfilePropertiesQuery = { properties: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> };

export type SaveAuthProviderConfigurationQueryVariables = Exact<{
  providerId: Scalars['ID'];
  id: Scalars['ID'];
  displayName?: InputMaybe<Scalars['String']>;
  disabled?: InputMaybe<Scalars['Boolean']>;
  iconURL?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  parameters?: InputMaybe<Scalars['Object']>;
}>;


export type SaveAuthProviderConfigurationQuery = { configuration: { providerId: string; id: string; displayName: string; disabled: boolean; iconURL?: string; description?: string; parameters: any; signInLink?: string; signOutLink?: string; redirectLink?: string; metadataLink?: string } };

export type SaveUserMetaParametersQueryVariables = Exact<{
  userId: Scalars['ID'];
  parameters: Scalars['Object'];
}>;


export type SaveUserMetaParametersQuery = { setUserMetaParameterValues: boolean };

export type CreateUserQueryVariables = Exact<{
  userId: Scalars['ID'];
  includeMetaParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;


export type CreateUserQuery = { user: { userId: string; grantedRoles: Array<string>; linkedAuthProviders: Array<string>; metaParameters?: any; enabled: boolean; origins: Array<{ type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }> } };

export type DeleteUserQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;


export type DeleteUserQuery = { deleteUser?: boolean };

export type DeleteUserMetaParameterQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteUserMetaParameterQuery = { state: boolean };

export type EnableUserQueryVariables = Exact<{
  userId: Scalars['ID'];
  enabled: Scalars['Boolean'];
}>;


export type EnableUserQuery = { enableUser?: boolean };

export type GetPermissionsListQueryVariables = Exact<{
  roleId?: InputMaybe<Scalars['ID']>;
}>;


export type GetPermissionsListQuery = { permissions: Array<{ id: string; label?: string; description?: string; provider: string; category?: string }> };

export type GetUserGrantedConnectionsQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']>;
}>;


export type GetUserGrantedConnectionsQuery = { grantedConnections: Array<{ connectionId: string; dataSourceId: string; subjectId: string; subjectType: AdminSubjectType }> };

export type GetUsersListQueryVariables = Exact<{
  userId?: InputMaybe<Scalars['ID']>;
  includeMetaParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;


export type GetUsersListQuery = { users: Array<{ userId: string; grantedRoles: Array<string>; linkedAuthProviders: Array<string>; metaParameters?: any; enabled: boolean; origins: Array<{ type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }> }> };

export type GrantUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;


export type GrantUserRoleQuery = { grantUserRole?: boolean };

export type RevokeUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;


export type RevokeUserRoleQuery = { revokeUserRole?: boolean };

export type SetConnectionsQueryVariables = Exact<{
  userId: Scalars['ID'];
  connections: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type SetConnectionsQuery = { grantedConnections?: boolean };

export type SetUserConfigurationParameterMutationVariables = Exact<{
  name: Scalars['String'];
  value?: InputMaybe<Scalars['Object']>;
}>;


export type SetUserConfigurationParameterMutation = { setUserConfigurationParameter: boolean };

export type SetUserCredentialsQueryVariables = Exact<{
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
}>;


export type SetUserCredentialsQuery = { setUserCredentials?: boolean };

export type SetUserMetaParameterQueryVariables = Exact<{
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
  required: Scalars['Boolean'];
}>;


export type SetUserMetaParameterQuery = { parameter: { id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number } };

export type UpdateUserProfilePropertiesQueryVariables = Exact<{
  userId: Scalars['ID'];
  parameters: Scalars['Object'];
}>;


export type UpdateUserProfilePropertiesQuery = { state: boolean };

export type CreateConnectionConfigurationQueryVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CreateConnectionConfigurationQuery = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type CreateConnectionConfigurationFromNodeQueryVariables = Exact<{
  nodePath: Scalars['String'];
  config?: InputMaybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CreateConnectionConfigurationFromNodeQuery = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type DeleteConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteConnectionConfigurationQuery = { deleteConnectionConfiguration?: boolean };

export type GetConnectionAccessQueryVariables = Exact<{
  connectionId?: InputMaybe<Scalars['ID']>;
}>;


export type GetConnectionAccessQuery = { subjects: Array<{ connectionId: string; dataSourceId: string; subjectId: string; subjectType: AdminSubjectType }> };

export type GetConnectionsQueryVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type GetConnectionsQuery = { connections: Array<{ id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> };

export type GetSubjectConnectionAccessQueryVariables = Exact<{
  subjectId?: InputMaybe<Scalars['ID']>;
}>;


export type GetSubjectConnectionAccessQuery = { grantInfo: Array<{ connectionId: string; dataSourceId: string; subjectId: string; subjectType: AdminSubjectType }> };

export type SearchDatabasesQueryVariables = Exact<{
  hosts: Array<Scalars['String']> | Scalars['String'];
}>;


export type SearchDatabasesQuery = { databases: Array<{ displayName: string; host: string; port: number; possibleDrivers: Array<string>; defaultDriver: string }> };

export type SetConnectionAccessQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type SetConnectionAccessQuery = { setConnectionSubjectAccess?: boolean };

export type SetSubjectConnectionAccessQueryVariables = Exact<{
  subjectId: Scalars['ID'];
  connections: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type SetSubjectConnectionAccessQuery = { setSubjectConnectionAccess?: boolean };

export type UpdateConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type UpdateConnectionConfigurationQuery = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type CloseConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CloseConnectionMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type CreateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CreateConnectionMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type CreateConnectionFromNodeMutationVariables = Exact<{
  nodePath: Scalars['String'];
  config?: InputMaybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CreateConnectionFromNodeMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type CreateConnectionFromTemplateMutationVariables = Exact<{
  templateId: Scalars['ID'];
  connectionName: Scalars['String'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type CreateConnectionFromTemplateMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type DeleteConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;


export type DeleteConnectionMutation = { deleteConnection: boolean };

export type DriverListQueryVariables = Exact<{
  driverId?: InputMaybe<Scalars['ID']>;
  includeProviderProperties: Scalars['Boolean'];
  includeDriverProperties: Scalars['Boolean'];
  includeDriverParameters: Scalars['Boolean'];
}>;


export type DriverListQuery = { drivers: Array<{ id: string; name?: string; icon?: string; description?: string; defaultPort?: string; defaultDatabase?: string; defaultServer?: string; defaultUser?: string; sampleURL?: string; embedded?: boolean; enabled: boolean; requiresServerName?: boolean; anonymousAccess?: boolean; promotedScore?: number; defaultAuthModel: string; applicableAuthModels: Array<string>; applicableNetworkHandlers: Array<string>; driverParameters?: any; providerProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; length: ObjectPropertyLength; features: Array<string>; order: number }>; driverProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any> }> }> };

export type ExecutionContextCreateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  defaultCatalog?: InputMaybe<Scalars['String']>;
  defaultSchema?: InputMaybe<Scalars['String']>;
}>;


export type ExecutionContextCreateMutation = { context: { id: string; connectionId: string; defaultCatalog?: string; defaultSchema?: string } };

export type ExecutionContextDestroyMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}>;


export type ExecutionContextDestroyMutation = { sqlContextDestroy: boolean };

export type ExecutionContextListQueryVariables = Exact<{
  connectionId?: InputMaybe<Scalars['ID']>;
  contextId?: InputMaybe<Scalars['ID']>;
}>;


export type ExecutionContextListQuery = { contexts: Array<{ id: string; connectionId: string; defaultCatalog?: string; defaultSchema?: string }> };

export type ExecutionContextUpdateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: InputMaybe<Scalars['ID']>;
  defaultSchema?: InputMaybe<Scalars['ID']>;
}>;


export type ExecutionContextUpdateMutation = { context: boolean };

export type GetAuthModelsQueryVariables = Exact<{ [key: string]: never }>;


export type GetAuthModelsQuery = { models: Array<{ id: string; displayName: string; description?: string; icon?: string; requiresLocalConfiguration?: boolean; properties: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }> };

export type GetTemplateConnectionsQueryVariables = Exact<{
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type GetTemplateConnectionsQuery = { connections: Array<{ id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> };

export type GetUserConnectionsQueryVariables = Exact<{
  id?: InputMaybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type GetUserConnectionsQuery = { connections: Array<{ id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> };

export type InitConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  credentials?: InputMaybe<Scalars['Object']>;
  networkCredentials?: InputMaybe<Array<NetworkHandlerConfigInput> | NetworkHandlerConfigInput>;
  saveCredentials?: InputMaybe<Scalars['Boolean']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type InitConnectionMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type RefreshSessionConnectionsMutationVariables = Exact<{ [key: string]: never }>;


export type RefreshSessionConnectionsMutation = { refreshSessionConnections?: boolean };

export type SetConnectionNavigatorSettingsMutationVariables = Exact<{
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type SetConnectionNavigatorSettingsMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type TestConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
}>;


export type TestConnectionMutation = { connection: { id: string; connectTime?: string; serverVersion?: string; clientVersion?: string; connectionError?: { message?: string; errorCode?: string; stackTrace?: string } } };

export type TestNetworkHandlerMutationVariables = Exact<{
  config: NetworkHandlerConfigInput;
}>;


export type TestNetworkHandlerMutation = { info: { message?: string; clientVersion?: string; serverVersion?: string } };

export type UpdateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;


export type UpdateConnectionMutation = { connection: { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } };

export type ExportDataFromContainerQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
}>;


export type ExportDataFromContainerQuery = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } } };

export type ExportDataFromResultsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
}>;


export type ExportDataFromResultsQuery = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } } };

export type GetDataTransferProcessorsQueryVariables = Exact<{ [key: string]: never }>;


export type GetDataTransferProcessorsQuery = { processors: Array<{ id: string; name?: string; description?: string; fileExtension?: string; appFileExtension?: string; appName?: string; order: number; icon?: string; isBinary?: boolean; isHTML?: boolean; properties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; length: ObjectPropertyLength; features: Array<string>; order: number }> }> };

export type RemoveDataTransferFileQueryVariables = Exact<{
  dataFileId: Scalars['String'];
}>;


export type RemoveDataTransferFileQuery = { result?: boolean };

export type NavGetStructContainersQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  catalogId?: InputMaybe<Scalars['ID']>;
  withDetails: Scalars['Boolean'];
}>;


export type NavGetStructContainersQuery = { navGetStructContainers: { supportsCatalogChange: boolean; supportsSchemaChange: boolean; catalogList: Array<{ catalog: { id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> }; schemaList: Array<{ id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> }> }>; schemaList: Array<{ id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> }> } };

export type AdminRoleInfoFragment = { roleId: string; roleName?: string; description?: string };

export type AdminUserInfoFragment = { userId: string; grantedRoles: Array<string>; linkedAuthProviders: Array<string>; metaParameters?: any; enabled: boolean; origins: Array<{ type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }> };

export type AllNavigatorSettingsFragment = { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean };

export type AsyncTaskInfoFragment = { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } };

export type AuthProviderConfigurationParametersFragment = { id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number };

export type AuthTokenFragment = { authProvider: string; authConfiguration?: string; loginTime: any; message?: string; origin: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> } };

export type DatabaseConnectionFragment = { id: string; name: string; description?: string; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: string; nodePath?: string; host?: string; port?: string; serverName?: string; databaseName?: string; url?: string; properties?: any; providerProperties: any; features: Array<string>; supportedDataFormats: Array<ResultDataFormat>; authNeeded: boolean; authModel?: string; origin?: { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> }; authProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number }>; networkHandlersConfig: Array<{ id: string; enabled: boolean; authType: NetworkHandlerAuthType; userName?: string; password?: string; key?: string; savePassword: boolean; properties?: any }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } };

export type DatabaseDriverFragment = { id: string; name?: string; icon?: string; description?: string; defaultPort?: string; defaultDatabase?: string; defaultServer?: string; defaultUser?: string; sampleURL?: string; embedded?: boolean; enabled: boolean; requiresServerName?: boolean; anonymousAccess?: boolean; promotedScore?: number; defaultAuthModel: string; applicableAuthModels: Array<string>; applicableNetworkHandlers: Array<string>; driverParameters?: any; providerProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; length: ObjectPropertyLength; features: Array<string>; order: number }>; driverProperties?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any> }> };

export type ExecutionContextInfoFragment = { id: string; connectionId: string; defaultCatalog?: string; defaultSchema?: string };

export type NavNodeDbObjectInfoFragment = { id: string; object?: { type?: string; features?: Array<string>; properties?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> } };

export type NavNodeInfoFragment = { id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> };

export type NavNodePropertiesFragment = { id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number };

export type ObjectOriginInfoFragment = { type: string; subType?: string; displayName: string; icon?: string; details?: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; defaultValue?: any; validValues?: Array<any>; value?: any; length: ObjectPropertyLength; features: Array<string>; order: number }> };

export type SqlScriptInfoFragment = { queries: Array<{ start: number; end: number }> };

export type SessionStateFragment = { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string; actionParameters?: any };

export type UserConnectionAuthPropertiesFragment = { id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; length: ObjectPropertyLength; features: Array<string>; order: number };

export type UserConnectionNetworkHandlerPropertiesFragment = { id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; order: number; length: ObjectPropertyLength; features: Array<string> };

export type GetAsyncTaskInfoMutationVariables = Exact<{
  taskId: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
}>;


export type GetAsyncTaskInfoMutation = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } } };

export type GetNetworkHandlersQueryVariables = Exact<{ [key: string]: never }>;


export type GetNetworkHandlersQuery = { handlers: Array<{ id: string; codeName: string; label: string; description?: string; secured: boolean; type?: NetworkHandlerType; properties: Array<{ id?: string; displayName?: string; description?: string; category?: string; dataType?: string; value?: any; validValues?: Array<any>; defaultValue?: any; order: number; length: ObjectPropertyLength; features: Array<string> }> }> };

export type AsyncReadDataFromContainerMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  resultId?: InputMaybe<Scalars['ID']>;
  filter?: InputMaybe<SqlDataFilter>;
  dataFormat?: InputMaybe<ResultDataFormat>;
}>;


export type AsyncReadDataFromContainerMutation = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } } };

export type AsyncSqlExecuteQueryMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  resultId?: InputMaybe<Scalars['ID']>;
  filter?: InputMaybe<SqlDataFilter>;
  dataFormat?: InputMaybe<ResultDataFormat>;
}>;


export type AsyncSqlExecuteQueryMutation = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; errorType?: string; stackTrace?: string } } };

export type AsyncSqlExplainExecutionPlanMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  configuration: Scalars['Object'];
}>;


export type AsyncSqlExplainExecutionPlanMutation = { taskInfo: { id: string; name?: string; running: boolean; status?: string; taskResult?: any; error?: { message?: string; errorCode?: string; stackTrace?: string } } };

export type CloseResultMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
}>;


export type CloseResultMutation = { result: boolean };

export type GetResultsetDataUrlMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  lobColumnIndex: Scalars['Int'];
  row: Array<SqlResultRow> | SqlResultRow;
}>;


export type GetResultsetDataUrlMutation = { url: string };

export type GetSqlExecuteTaskResultsMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;


export type GetSqlExecuteTaskResultsMutation = { result: { duration: number; statusMessage?: string; filterText?: string; results: Array<{ title?: string; updateRowCount?: number; sourceQuery?: string; dataFormat?: ResultDataFormat; resultSet?: { id: string; rows?: Array<Array<any>>; singleEntity: boolean; hasMoreData: boolean; columns?: Array<{ dataKind?: string; entityName?: string; fullTypeName?: string; icon?: string; label?: string; maxLength?: number; name?: string; position: number; precision?: number; required: boolean; readOnly: boolean; readOnlyStatus?: string; scale?: number; typeName?: string; supportedOperations: Array<{ id: string; expression: string; argumentCount?: number }> }> } }> } };

export type GetSqlExecutionPlanResultMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;


export type GetSqlExecutionPlanResultMutation = { result: { query: string; nodes: Array<{ id: string; parentId?: string; kind: string; name?: string; type: string; condition?: string; description?: string; properties: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> }> } };

export type UpdateResultsDataBatchMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
  deletedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
  addedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
}>;


export type UpdateResultsDataBatchMutation = { result: { duration: number; filterText?: string; results: Array<{ updateRowCount?: number; resultSet?: { id: string; rows?: Array<Array<any>>; singleEntity: boolean; hasMoreData: boolean } }> } };

export type UpdateResultsDataBatchScriptMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
  deletedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
  addedRows?: InputMaybe<Array<SqlResultRow> | SqlResultRow>;
}>;


export type UpdateResultsDataBatchScriptMutation = { result: string };

export type MetadataGetNodeDdlQueryVariables = Exact<{
  nodeId: Scalars['ID'];
}>;


export type MetadataGetNodeDdlQuery = { metadataGetNodeDDL?: string };

export type GetChildrenDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  offset?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  filter?: InputMaybe<ObjectPropertyFilter>;
}>;


export type GetChildrenDbObjectInfoQuery = { dbObjects: Array<{ id: string; object?: { type?: string; features?: Array<string>; properties?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> } }> };

export type GetDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: InputMaybe<ObjectPropertyFilter>;
}>;


export type GetDbObjectInfoQuery = { objectInfo: { id: string; object?: { type?: string; features?: Array<string>; properties?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> } } };

export type GetNavNodeFullNameQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;


export type GetNavNodeFullNameQuery = { navNodeInfo: { fullName?: string } };

export type NavDeleteNodesMutationVariables = Exact<{
  nodePaths: Array<Scalars['ID']> | Scalars['ID'];
}>;


export type NavDeleteNodesMutation = { navDeleteNodes?: number };

export type NavNodeChildrenQueryVariables = Exact<{
  parentPath: Scalars['ID'];
  offset?: InputMaybe<Scalars['Int']>;
  limit?: InputMaybe<Scalars['Int']>;
  withDetails: Scalars['Boolean'];
}>;


export type NavNodeChildrenQuery = { navNodeChildren: Array<{ id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> }>; navNodeInfo: { id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> } };

export type NavNodeInfoQueryVariables = Exact<{
  nodePath: Scalars['ID'];
  withDetails: Scalars['Boolean'];
}>;


export type NavNodeInfoQuery = { navNodeInfo: { id: string; name?: string; hasChildren?: boolean; nodeType?: string; icon?: string; folder?: boolean; inline?: boolean; navigable?: boolean; features?: Array<string>; object?: { features?: Array<string> }; nodeDetails?: Array<{ id?: string; category?: string; dataType?: string; description?: string; displayName?: string; length: ObjectPropertyLength; features: Array<string>; value?: any; order: number }> } };

export type NavRefreshNodeQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;


export type NavRefreshNodeQuery = { navRefreshNode?: boolean };

export type NavRenameNodeMutationVariables = Exact<{
  nodePath: Scalars['ID'];
  newName: Scalars['String'];
}>;


export type NavRenameNodeMutation = { navRenameNode?: string };

export type CreateResourceMutationVariables = Exact<{
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
  isFolder: Scalars['Boolean'];
}>;


export type CreateResourceMutation = { rmCreateResource: string };

export type DeleteResourceMutationVariables = Exact<{
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
  recursive: Scalars['Boolean'];
}>;


export type DeleteResourceMutation = { rmDeleteResource?: boolean };

export type GetProjectListQueryVariables = Exact<{ [key: string]: never }>;


export type GetProjectListQuery = { projects: Array<{ id: string; name: string; shared: boolean }> };

export type GetResourceListQueryVariables = Exact<{
  projectId: Scalars['String'];
  folder?: InputMaybe<Scalars['String']>;
  nameMask?: InputMaybe<Scalars['String']>;
  readProperties?: InputMaybe<Scalars['Boolean']>;
  readHistory?: InputMaybe<Scalars['Boolean']>;
}>;


export type GetResourceListQuery = { resources: Array<{ name: string; folder: boolean; length: number }> };

export type ReadResourceQueryVariables = Exact<{
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
}>;


export type ReadResourceQuery = { value: string };

export type WriteResourceContentMutationVariables = Exact<{
  projectId: Scalars['String'];
  resourcePath: Scalars['String'];
  data: Scalars['String'];
}>;


export type WriteResourceContentMutation = { rmWriteResourceStringContent: string };

export type ConfigureServerQueryVariables = Exact<{
  configuration: ServerConfigInput;
}>;


export type ConfigureServerQuery = { configureServer: boolean };

export type ListFeatureSetsQueryVariables = Exact<{ [key: string]: never }>;


export type ListFeatureSetsQuery = { features: Array<{ id: string; label: string; description?: string; icon?: string; enabled: boolean }> };

export type SetDefaultNavigatorSettingsQueryVariables = Exact<{
  settings: NavigatorSettingsInput;
}>;


export type SetDefaultNavigatorSettingsQuery = { setDefaultNavigatorSettings: boolean };

export type ChangeSessionLanguageMutationVariables = Exact<{
  locale: Scalars['String'];
}>;


export type ChangeSessionLanguageMutation = { changeSessionLanguage?: boolean };

export type OpenSessionMutationVariables = Exact<{
  defaultLocale?: InputMaybe<Scalars['String']>;
}>;


export type OpenSessionMutation = { session: { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string; actionParameters?: any } };

export type ReadSessionLogQueryVariables = Exact<{
  maxEntries: Scalars['Int'];
  clearEntries: Scalars['Boolean'];
}>;


export type ReadSessionLogQuery = { log: Array<{ time?: any; type: string; message?: string; stackTrace?: string }> };

export type ServerConfigQueryVariables = Exact<{ [key: string]: never }>;


export type ServerConfigQuery = { serverConfig: { name: string; version: string; workspaceId: string; serverURL: string; rootURI: string; hostName: string; productConfiguration: any; supportsCustomConnections?: boolean; supportsConnectionBrowser?: boolean; supportsWorkspaces?: boolean; sessionExpireTime?: number; anonymousAccessEnabled?: boolean; adminCredentialsSaveEnabled?: boolean; publicCredentialsSaveEnabled?: boolean; resourceManagerEnabled?: boolean; licenseRequired: boolean; licenseValid: boolean; configurationMode?: boolean; developmentMode?: boolean; redirectOnFederatedAuth?: boolean; enabledFeatures: Array<string>; enabledAuthProviders: Array<string>; resourceQuotas: any; disabledDrivers: Array<string>; supportedLanguages: Array<{ isoCode: string; displayName?: string; nativeName?: string }>; defaultNavigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean }; productInfo: { id: string; version: string; latestVersionInfo?: string; name: string; description?: string; buildTime: string; releaseTime: string; licenseInfo?: string } } };

export type SessionPermissionsQueryVariables = Exact<{ [key: string]: never }>;


export type SessionPermissionsQuery = { permissions: Array<string> };

export type SessionStateQueryVariables = Exact<{ [key: string]: never }>;


export type SessionStateQuery = { sessionState: { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string; actionParameters?: any } };

export type TouchSessionMutationVariables = Exact<{ [key: string]: never }>;


export type TouchSessionMutation = { touchSession?: boolean };

export type FormatSqlQueryQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
}>;


export type FormatSqlQueryQuery = { query: string };

export type ParseSqlQueryQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  script: Scalars['String'];
  position: Scalars['Int'];
}>;


export type ParseSqlQueryQuery = { queryInfo: { start: number; end: number } };

export type ParseSqlScriptQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  script: Scalars['String'];
}>;


export type ParseSqlScriptQuery = { scriptInfo: { queries: Array<{ start: number; end: number }> } };

export type QuerySqlCompletionProposalsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  position: Scalars['Int'];
  query: Scalars['String'];
  simple?: InputMaybe<Scalars['Boolean']>;
  maxResults?: InputMaybe<Scalars['Int']>;
}>;


export type QuerySqlCompletionProposalsQuery = { proposals?: Array<{ cursorPosition?: number; displayString: string; icon?: string; nodePath?: string; replacementLength: number; replacementOffset: number; replacementString: string; score?: number; type: string }> };

export type QuerySqlDialectInfoQueryVariables = Exact<{
  connectionId: Scalars['ID'];
}>;


export type QuerySqlDialectInfoQuery = { dialect?: { name: string; dataTypes: Array<string>; functions: Array<string>; reservedWords: Array<string>; quoteStrings: Array<Array<string>>; singleLineComments: Array<string>; multiLineComments: Array<Array<string>>; catalogSeparator?: string; structSeparator?: string; scriptDelimiter?: string; supportsExplainExecutionPlan: boolean } };

export type SqlEntityQueryGeneratorsQueryVariables = Exact<{
  nodePathList: Array<Scalars['String']> | Scalars['String'];
}>;


export type SqlEntityQueryGeneratorsQuery = { generators: Array<{ id: string; label: string; description?: string; order: number; multiObject: boolean }> };

export type SqlGenerateEntityQueryQueryVariables = Exact<{
  generatorId: Scalars['String'];
  options: Scalars['Object'];
  nodePathList: Array<Scalars['String']> | Scalars['String'];
}>;


export type SqlGenerateEntityQueryQuery = { sqlGenerateEntityQuery: string };

export const AdminRoleInfoFragmentDoc = `
    fragment AdminRoleInfo on AdminRoleInfo {
  roleId
  roleName
  description
}
    `;
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
    length
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
  metaParameters @include(if: $includeMetaParameters)
  origins {
    ...ObjectOriginInfo
  }
  enabled
}
    ${ObjectOriginInfoFragmentDoc}`;
export const AsyncTaskInfoFragmentDoc = `
    fragment AsyncTaskInfo on AsyncTaskInfo {
  id
  name
  running
  status
  error {
    message
    errorCode
    errorType
    stackTrace
  }
  taskResult
}
    `;
export const AuthProviderConfigurationParametersFragmentDoc = `
    fragment AuthProviderConfigurationParameters on ObjectPropertyInfo {
  id
  displayName
  description
  category
  dataType
  value
  validValues
  defaultValue
  length
  features
  order
}
    `;
export const AuthTokenFragmentDoc = `
    fragment AuthToken on UserAuthToken {
  authProvider
  authConfiguration
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
  length
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
  folder
  nodePath
  host
  port
  serverName
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
    authType
    userName @include(if: $customIncludeNetworkHandlerCredentials)
    password @include(if: $customIncludeNetworkHandlerCredentials)
    key @include(if: $customIncludeNetworkHandlerCredentials)
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
  enabled
  requiresServerName
  anonymousAccess
  promotedScore
  defaultAuthModel
  applicableAuthModels
  applicableNetworkHandlers
  providerProperties @include(if: $includeProviderProperties) {
    id
    displayName
    description
    category
    dataType
    defaultValue
    validValues
    length
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
export const ExecutionContextInfoFragmentDoc = `
    fragment ExecutionContextInfo on SQLContextInfo {
  id
  connectionId
  defaultCatalog
  defaultSchema
}
    `;
export const NavNodePropertiesFragmentDoc = `
    fragment NavNodeProperties on ObjectPropertyInfo {
  id
  category
  dataType
  description
  displayName
  length
  features
  value
  order
}
    `;
export const NavNodeDbObjectInfoFragmentDoc = `
    fragment NavNodeDBObjectInfo on NavigatorNodeInfo {
  id
  object {
    type
    features
    properties(filter: $filter) {
      ...NavNodeProperties
    }
  }
}
    ${NavNodePropertiesFragmentDoc}`;
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
export const SqlScriptInfoFragmentDoc = `
    fragment SQLScriptInfo on SQLScriptInfo {
  queries {
    start
    end
  }
}
    `;
export const SessionStateFragmentDoc = `
    fragment SessionState on SessionInfo {
  createTime
  lastAccessTime
  cacheExpired
  locale
  actionParameters
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
  length
  features
}
    `;
export const AsyncTaskCancelDocument = `
    mutation asyncTaskCancel($taskId: String!) {
  result: asyncTaskCancel(id: $taskId)
}
    `;
export const CreateRoleDocument = `
    query createRole($roleId: ID!, $roleName: String, $description: String) {
  role: createRole(
    roleId: $roleId
    roleName: $roleName
    description: $description
  ) {
    ...AdminRoleInfo
  }
}
    ${AdminRoleInfoFragmentDoc}`;
export const DeleteRoleDocument = `
    query deleteRole($roleId: ID!) {
  deleteRole(roleId: $roleId)
}
    `;
export const GetRoleGrantedUsersDocument = `
    query getRoleGrantedUsers($roleId: ID!) {
  role: listRoles(roleId: $roleId) {
    grantedUsers
  }
}
    `;
export const GetRolesListDocument = `
    query getRolesList($roleId: ID) {
  roles: listRoles(roleId: $roleId) {
    ...AdminRoleInfo
  }
}
    ${AdminRoleInfoFragmentDoc}`;
export const UpdateRoleDocument = `
    query updateRole($roleId: ID!, $roleName: String, $description: String) {
  role: updateRole(
    roleId: $roleId
    roleName: $roleName
    description: $description
  ) {
    ...AdminRoleInfo
  }
}
    ${AdminRoleInfoFragmentDoc}`;
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
export const DeleteAuthProviderConfigurationDocument = `
    query deleteAuthProviderConfiguration($id: ID!) {
  deleteAuthProviderConfiguration(id: $id)
}
    `;
export const GetActiveUserDocument = `
    query getActiveUser($includeMetaParameters: Boolean!, $includeConfigurationParameters: Boolean!, $customIncludeOriginDetails: Boolean!) {
  user: activeUser {
    userId
    displayName
    linkedAuthProviders
    metaParameters @include(if: $includeMetaParameters)
    configurationParameters @include(if: $includeConfigurationParameters)
    authTokens {
      ...AuthToken
    }
  }
}
    ${AuthTokenFragmentDoc}`;
export const GetAuthProviderConfigurationParametersDocument = `
    query getAuthProviderConfigurationParameters($providerId: ID!) {
  parameters: listAuthProviderConfigurationParameters(providerId: $providerId) {
    ...AuthProviderConfigurationParameters
  }
}
    ${AuthProviderConfigurationParametersFragmentDoc}`;
export const GetAuthProviderConfigurationsDocument = `
    query getAuthProviderConfigurations($providerId: ID) {
  configurations: listAuthProviderConfigurations(providerId: $providerId) {
    providerId
    id
    displayName
    disabled
    iconURL
    description
    parameters
    signInLink
    signOutLink
    redirectLink
    metadataLink
  }
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
    configurable
    configurations {
      id
      displayName
      iconURL
      description
      signInLink
      signOutLink
      metadataLink
    }
    credentialProfiles {
      id
      label
      description
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
    requiredFeatures
  }
}
    `;
export const GetUserProfilePropertiesDocument = `
    query getUserProfileProperties {
  properties: listUserProfileProperties {
    ...UserConnectionAuthProperties
  }
}
    ${UserConnectionAuthPropertiesFragmentDoc}`;
export const SaveAuthProviderConfigurationDocument = `
    query saveAuthProviderConfiguration($providerId: ID!, $id: ID!, $displayName: String, $disabled: Boolean, $iconURL: String, $description: String, $parameters: Object) {
  configuration: saveAuthProviderConfiguration(
    providerId: $providerId
    id: $id
    displayName: $displayName
    disabled: $disabled
    iconURL: $iconURL
    description: $description
    parameters: $parameters
  ) {
    providerId
    id
    displayName
    disabled
    iconURL
    description
    parameters
    signInLink
    signOutLink
    redirectLink
    metadataLink
  }
}
    `;
export const SaveUserMetaParametersDocument = `
    query saveUserMetaParameters($userId: ID!, $parameters: Object!) {
  setUserMetaParameterValues(userId: $userId, parameters: $parameters)
}
    `;
export const CreateUserDocument = `
    query createUser($userId: ID!, $includeMetaParameters: Boolean!, $customIncludeOriginDetails: Boolean!) {
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
export const DeleteUserMetaParameterDocument = `
    query deleteUserMetaParameter($id: ID!) {
  state: deleteUserMetaParameter(id: $id)
}
    `;
export const EnableUserDocument = `
    query enableUser($userId: ID!, $enabled: Boolean!) {
  enableUser(userId: $userId, enabled: $enabled)
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
export const GetUserGrantedConnectionsDocument = `
    query getUserGrantedConnections($userId: ID) {
  grantedConnections: getSubjectConnectionAccess(subjectId: $userId) {
    connectionId
    dataSourceId
    subjectId
    subjectType
  }
}
    `;
export const GetUsersListDocument = `
    query getUsersList($userId: ID, $includeMetaParameters: Boolean!, $customIncludeOriginDetails: Boolean!) {
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
export const SetUserConfigurationParameterDocument = `
    mutation setUserConfigurationParameter($name: String!, $value: Object) {
  setUserConfigurationParameter(name: $name, value: $value)
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
export const SetUserMetaParameterDocument = `
    query setUserMetaParameter($id: ID!, $displayName: String!, $description: String, $required: Boolean!) {
  parameter: saveUserMetaParameter(
    id: $id
    displayName: $displayName
    description: $description
    required: $required
  ) {
    ...UserConnectionAuthProperties
  }
}
    ${UserConnectionAuthPropertiesFragmentDoc}`;
export const UpdateUserProfilePropertiesDocument = `
    query updateUserProfileProperties($userId: ID!, $parameters: Object!) {
  state: setUserMetaParameterValues(userId: $userId, parameters: $parameters)
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
    dataSourceId
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
export const GetSubjectConnectionAccessDocument = `
    query getSubjectConnectionAccess($subjectId: ID) {
  grantInfo: getSubjectConnectionAccess(subjectId: $subjectId) {
    connectionId
    dataSourceId
    subjectId
    subjectType
  }
}
    `;
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
export const SetSubjectConnectionAccessDocument = `
    query setSubjectConnectionAccess($subjectId: ID!, $connections: [ID!]!) {
  setSubjectConnectionAccess(subjectId: $subjectId, connections: $connections)
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
    ...ExecutionContextInfo
  }
}
    ${ExecutionContextInfoFragmentDoc}`;
export const ExecutionContextDestroyDocument = `
    mutation executionContextDestroy($connectionId: ID!, $contextId: ID!) {
  sqlContextDestroy(connectionId: $connectionId, contextId: $contextId)
}
    `;
export const ExecutionContextListDocument = `
    query executionContextList($connectionId: ID, $contextId: ID) {
  contexts: sqlListContexts(connectionId: $connectionId, contextId: $contextId) {
    ...ExecutionContextInfo
  }
}
    ${ExecutionContextInfoFragmentDoc}`;
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
    requiresLocalConfiguration
    properties {
      id
      displayName
      description
      category
      dataType
      validValues
      defaultValue
      length
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
    ...AsyncTaskInfo
  }
}
    ${AsyncTaskInfoFragmentDoc}`;
export const ExportDataFromResultsDocument = `
    query exportDataFromResults($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $parameters: DataTransferParameters!) {
  taskInfo: dataTransferExportDataFromResults(
    connectionId: $connectionId
    contextId: $contextId
    resultsId: $resultsId
    parameters: $parameters
  ) {
    ...AsyncTaskInfo
  }
}
    ${AsyncTaskInfoFragmentDoc}`;
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
      length
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
    query navGetStructContainers($connectionId: ID!, $catalogId: ID, $withDetails: Boolean!) {
  navGetStructContainers(connectionId: $connectionId, catalog: $catalogId) {
    catalogList {
      catalog {
        ...NavNodeInfo
      }
      schemaList {
        ...NavNodeInfo
      }
    }
    schemaList {
      ...NavNodeInfo
    }
    supportsCatalogChange
    supportsSchemaChange
  }
}
    ${NavNodeInfoFragmentDoc}`;
export const GetAsyncTaskInfoDocument = `
    mutation getAsyncTaskInfo($taskId: String!, $removeOnFinish: Boolean!) {
  taskInfo: asyncTaskInfo(id: $taskId, removeOnFinish: $removeOnFinish) {
    ...AsyncTaskInfo
  }
}
    ${AsyncTaskInfoFragmentDoc}`;
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
    mutation asyncReadDataFromContainer($connectionId: ID!, $contextId: ID!, $containerNodePath: ID!, $resultId: ID, $filter: SQLDataFilter, $dataFormat: ResultDataFormat) {
  taskInfo: asyncReadDataFromContainer(
    connectionId: $connectionId
    contextId: $contextId
    containerNodePath: $containerNodePath
    resultId: $resultId
    filter: $filter
    dataFormat: $dataFormat
  ) {
    ...AsyncTaskInfo
  }
}
    ${AsyncTaskInfoFragmentDoc}`;
export const AsyncSqlExecuteQueryDocument = `
    mutation asyncSqlExecuteQuery($connectionId: ID!, $contextId: ID!, $query: String!, $resultId: ID, $filter: SQLDataFilter, $dataFormat: ResultDataFormat) {
  taskInfo: asyncSqlExecuteQuery(
    connectionId: $connectionId
    contextId: $contextId
    sql: $query
    resultId: $resultId
    filter: $filter
    dataFormat: $dataFormat
  ) {
    ...AsyncTaskInfo
  }
}
    ${AsyncTaskInfoFragmentDoc}`;
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
export const CloseResultDocument = `
    mutation closeResult($connectionId: ID!, $contextId: ID!, $resultId: ID!) {
  result: sqlResultClose(
    connectionId: $connectionId
    contextId: $contextId
    resultId: $resultId
  )
}
    `;
export const GetResultsetDataUrlDocument = `
    mutation getResultsetDataURL($connectionId: ID!, $contextId: ID!, $resultsId: ID!, $lobColumnIndex: Int!, $row: [SQLResultRow!]!) {
  url: readLobValue(
    connectionId: $connectionId
    contextId: $contextId
    resultsId: $resultsId
    lobColumnIndex: $lobColumnIndex
    row: $row
  )
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
        singleEntity
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
        length
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
        singleEntity
        hasMoreData
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
    query getChildrenDBObjectInfo($navNodeId: ID!, $offset: Int, $limit: Int, $filter: ObjectPropertyFilter) {
  dbObjects: navNodeChildren(
    parentPath: $navNodeId
    offset: $offset
    limit: $limit
  ) {
    ...NavNodeDBObjectInfo
  }
}
    ${NavNodeDbObjectInfoFragmentDoc}`;
export const GetDbObjectInfoDocument = `
    query getDBObjectInfo($navNodeId: ID!, $filter: ObjectPropertyFilter) {
  objectInfo: navNodeInfo(nodePath: $navNodeId) {
    ...NavNodeDBObjectInfo
  }
}
    ${NavNodeDbObjectInfoFragmentDoc}`;
export const GetNavNodeFullNameDocument = `
    query getNavNodeFullName($nodePath: ID!) {
  navNodeInfo(nodePath: $nodePath) {
    fullName
  }
}
    `;
export const NavDeleteNodesDocument = `
    mutation navDeleteNodes($nodePaths: [ID!]!) {
  navDeleteNodes(nodePaths: $nodePaths)
}
    `;
export const NavNodeChildrenDocument = `
    query navNodeChildren($parentPath: ID!, $offset: Int, $limit: Int, $withDetails: Boolean!) {
  navNodeChildren(parentPath: $parentPath, offset: $offset, limit: $limit) {
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
export const NavRenameNodeDocument = `
    mutation navRenameNode($nodePath: ID!, $newName: String!) {
  navRenameNode(nodePath: $nodePath, newName: $newName)
}
    `;
export const CreateResourceDocument = `
    mutation createResource($projectId: String!, $resourcePath: String!, $isFolder: Boolean!) {
  rmCreateResource(
    projectId: $projectId
    resourcePath: $resourcePath
    isFolder: $isFolder
  )
}
    `;
export const DeleteResourceDocument = `
    mutation deleteResource($projectId: String!, $resourcePath: String!, $recursive: Boolean!) {
  rmDeleteResource(
    projectId: $projectId
    resourcePath: $resourcePath
    recursive: $recursive
  )
}
    `;
export const GetProjectListDocument = `
    query getProjectList {
  projects: rmListProjects {
    id
    name
    shared
  }
}
    `;
export const GetResourceListDocument = `
    query getResourceList($projectId: String!, $folder: String, $nameMask: String, $readProperties: Boolean, $readHistory: Boolean) {
  resources: rmListResources(
    projectId: $projectId
    folder: $folder
    nameMask: $nameMask
    readProperties: $readProperties
    readHistory: $readHistory
  ) {
    name
    folder
    length
  }
}
    `;
export const ReadResourceDocument = `
    query readResource($projectId: String!, $resourcePath: String!) {
  value: rmReadResourceAsString(
    projectId: $projectId
    resourcePath: $resourcePath
  )
}
    `;
export const WriteResourceContentDocument = `
    mutation writeResourceContent($projectId: String!, $resourcePath: String!, $data: String!) {
  rmWriteResourceStringContent(
    projectId: $projectId
    resourcePath: $resourcePath
    data: $data
  )
}
    `;
export const ConfigureServerDocument = `
    query configureServer($configuration: ServerConfigInput!) {
  configureServer(configuration: $configuration)
}
    `;
export const ListFeatureSetsDocument = `
    query listFeatureSets {
  features: listFeatureSets {
    id
    label
    description
    icon
    enabled
  }
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
    mutation openSession($defaultLocale: String) {
  session: openSession(defaultLocale: $defaultLocale) {
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
    hostName
    productConfiguration
    supportsCustomConnections
    supportsConnectionBrowser
    supportsWorkspaces
    sessionExpireTime
    anonymousAccessEnabled
    adminCredentialsSaveEnabled
    publicCredentialsSaveEnabled
    resourceManagerEnabled
    licenseRequired
    licenseValid
    configurationMode
    developmentMode
    redirectOnFederatedAuth
    enabledFeatures
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
    resourceQuotas
    disabledDrivers
    productInfo {
      id
      version
      latestVersionInfo
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
export const FormatSqlQueryDocument = `
    query formatSqlQuery($connectionId: ID!, $contextId: ID!, $query: String!) {
  query: sqlFormatQuery(
    connectionId: $connectionId
    contextId: $contextId
    query: $query
  )
}
    `;
export const ParseSqlQueryDocument = `
    query parseSQLQuery($connectionId: ID!, $script: String!, $position: Int!) {
  queryInfo: sqlParseQuery(
    connectionId: $connectionId
    script: $script
    position: $position
  ) {
    start
    end
  }
}
    `;
export const ParseSqlScriptDocument = `
    query parseSQLScript($connectionId: ID!, $script: String!) {
  scriptInfo: sqlParseScript(connectionId: $connectionId, script: $script) {
    ...SQLScriptInfo
  }
}
    ${SqlScriptInfoFragmentDoc}`;
export const QuerySqlCompletionProposalsDocument = `
    query querySqlCompletionProposals($connectionId: ID!, $contextId: ID!, $position: Int!, $query: String!, $simple: Boolean, $maxResults: Int) {
  proposals: sqlCompletionProposals(
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
export const SqlEntityQueryGeneratorsDocument = `
    query sqlEntityQueryGenerators($nodePathList: [String!]!) {
  generators: sqlEntityQueryGenerators(nodePathList: $nodePathList) {
    id
    label
    description
    order
    multiObject
  }
}
    `;
export const SqlGenerateEntityQueryDocument = `
    query sqlGenerateEntityQuery($generatorId: String!, $options: Object!, $nodePathList: [String!]!) {
  sqlGenerateEntityQuery(
    generatorId: $generatorId
    options: $options
    nodePathList: $nodePathList
  )
}
    `;

export type SdkFunctionWrapper = <T>(action: (requestHeaders?:Record<string, string>) => Promise<T>, operationName: string, operationType?: string) => Promise<T>;


const defaultWrapper: SdkFunctionWrapper = (action, _operationName, _operationType) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    asyncTaskCancel(variables: AsyncTaskCancelMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncTaskCancelMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncTaskCancelMutation>(AsyncTaskCancelDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncTaskCancel', 'mutation');
    },
    createRole(variables: CreateRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateRoleQuery>(CreateRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createRole', 'query');
    },
    deleteRole(variables: DeleteRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteRoleQuery>(DeleteRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteRole', 'query');
    },
    getRoleGrantedUsers(variables: GetRoleGrantedUsersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetRoleGrantedUsersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetRoleGrantedUsersQuery>(GetRoleGrantedUsersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getRoleGrantedUsers', 'query');
    },
    getRolesList(variables?: GetRolesListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetRolesListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetRolesListQuery>(GetRolesListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getRolesList', 'query');
    },
    updateRole(variables: UpdateRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateRoleQuery>(UpdateRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateRole', 'query');
    },
    authChangeLocalPassword(variables: AuthChangeLocalPasswordQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthChangeLocalPasswordQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthChangeLocalPasswordQuery>(AuthChangeLocalPasswordDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authChangeLocalPassword', 'query');
    },
    authLogin(variables: AuthLoginQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthLoginQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthLoginQuery>(AuthLoginDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authLogin', 'query');
    },
    authLogout(variables?: AuthLogoutQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthLogoutQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthLogoutQuery>(AuthLogoutDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authLogout', 'query');
    },
    deleteAuthProviderConfiguration(variables: DeleteAuthProviderConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteAuthProviderConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteAuthProviderConfigurationQuery>(DeleteAuthProviderConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteAuthProviderConfiguration', 'query');
    },
    getActiveUser(variables: GetActiveUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetActiveUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetActiveUserQuery>(GetActiveUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getActiveUser', 'query');
    },
    getAuthProviderConfigurationParameters(variables: GetAuthProviderConfigurationParametersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProviderConfigurationParametersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProviderConfigurationParametersQuery>(GetAuthProviderConfigurationParametersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviderConfigurationParameters', 'query');
    },
    getAuthProviderConfigurations(variables?: GetAuthProviderConfigurationsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProviderConfigurationsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProviderConfigurationsQuery>(GetAuthProviderConfigurationsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviderConfigurations', 'query');
    },
    getAuthProviders(variables?: GetAuthProvidersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProvidersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProvidersQuery>(GetAuthProvidersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviders', 'query');
    },
    getUserProfileProperties(variables?: GetUserProfilePropertiesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserProfilePropertiesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserProfilePropertiesQuery>(GetUserProfilePropertiesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserProfileProperties', 'query');
    },
    saveAuthProviderConfiguration(variables: SaveAuthProviderConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SaveAuthProviderConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SaveAuthProviderConfigurationQuery>(SaveAuthProviderConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'saveAuthProviderConfiguration', 'query');
    },
    saveUserMetaParameters(variables: SaveUserMetaParametersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SaveUserMetaParametersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SaveUserMetaParametersQuery>(SaveUserMetaParametersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'saveUserMetaParameters', 'query');
    },
    createUser(variables: CreateUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateUserQuery>(CreateUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createUser', 'query');
    },
    deleteUser(variables: DeleteUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteUserQuery>(DeleteUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteUser', 'query');
    },
    deleteUserMetaParameter(variables: DeleteUserMetaParameterQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteUserMetaParameterQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteUserMetaParameterQuery>(DeleteUserMetaParameterDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteUserMetaParameter', 'query');
    },
    enableUser(variables: EnableUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<EnableUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<EnableUserQuery>(EnableUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'enableUser', 'query');
    },
    getPermissionsList(variables?: GetPermissionsListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetPermissionsListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetPermissionsListQuery>(GetPermissionsListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getPermissionsList', 'query');
    },
    getUserGrantedConnections(variables?: GetUserGrantedConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserGrantedConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserGrantedConnectionsQuery>(GetUserGrantedConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserGrantedConnections', 'query');
    },
    getUsersList(variables: GetUsersListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUsersListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUsersListQuery>(GetUsersListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUsersList', 'query');
    },
    grantUserRole(variables: GrantUserRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GrantUserRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GrantUserRoleQuery>(GrantUserRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'grantUserRole', 'query');
    },
    revokeUserRole(variables: RevokeUserRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RevokeUserRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<RevokeUserRoleQuery>(RevokeUserRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'revokeUserRole', 'query');
    },
    setConnections(variables: SetConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionsQuery>(SetConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnections', 'query');
    },
    setUserConfigurationParameter(variables: SetUserConfigurationParameterMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetUserConfigurationParameterMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<SetUserConfigurationParameterMutation>(SetUserConfigurationParameterDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setUserConfigurationParameter', 'mutation');
    },
    setUserCredentials(variables: SetUserCredentialsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetUserCredentialsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetUserCredentialsQuery>(SetUserCredentialsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setUserCredentials', 'query');
    },
    setUserMetaParameter(variables: SetUserMetaParameterQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetUserMetaParameterQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetUserMetaParameterQuery>(SetUserMetaParameterDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setUserMetaParameter', 'query');
    },
    updateUserProfileProperties(variables: UpdateUserProfilePropertiesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateUserProfilePropertiesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateUserProfilePropertiesQuery>(UpdateUserProfilePropertiesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateUserProfileProperties', 'query');
    },
    createConnectionConfiguration(variables: CreateConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionConfigurationQuery>(CreateConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionConfiguration', 'query');
    },
    createConnectionConfigurationFromNode(variables: CreateConnectionConfigurationFromNodeQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionConfigurationFromNodeQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionConfigurationFromNodeQuery>(CreateConnectionConfigurationFromNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionConfigurationFromNode', 'query');
    },
    deleteConnectionConfiguration(variables: DeleteConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteConnectionConfigurationQuery>(DeleteConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteConnectionConfiguration', 'query');
    },
    getConnectionAccess(variables?: GetConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetConnectionAccessQuery>(GetConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getConnectionAccess', 'query');
    },
    getConnections(variables: GetConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetConnectionsQuery>(GetConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getConnections', 'query');
    },
    getSubjectConnectionAccess(variables?: GetSubjectConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSubjectConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSubjectConnectionAccessQuery>(GetSubjectConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSubjectConnectionAccess', 'query');
    },
    searchDatabases(variables: SearchDatabasesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SearchDatabasesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SearchDatabasesQuery>(SearchDatabasesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'searchDatabases', 'query');
    },
    setConnectionAccess(variables: SetConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionAccessQuery>(SetConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnectionAccess', 'query');
    },
    setSubjectConnectionAccess(variables: SetSubjectConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetSubjectConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetSubjectConnectionAccessQuery>(SetSubjectConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setSubjectConnectionAccess', 'query');
    },
    updateConnectionConfiguration(variables: UpdateConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateConnectionConfigurationQuery>(UpdateConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateConnectionConfiguration', 'query');
    },
    closeConnection(variables: CloseConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CloseConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CloseConnectionMutation>(CloseConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'closeConnection', 'mutation');
    },
    createConnection(variables: CreateConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionMutation>(CreateConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnection', 'mutation');
    },
    createConnectionFromNode(variables: CreateConnectionFromNodeMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionFromNodeMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionFromNodeMutation>(CreateConnectionFromNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionFromNode', 'mutation');
    },
    createConnectionFromTemplate(variables: CreateConnectionFromTemplateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionFromTemplateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionFromTemplateMutation>(CreateConnectionFromTemplateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionFromTemplate', 'mutation');
    },
    deleteConnection(variables: DeleteConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteConnectionMutation>(DeleteConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteConnection', 'mutation');
    },
    driverList(variables: DriverListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DriverListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DriverListQuery>(DriverListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'driverList', 'query');
    },
    executionContextCreate(variables: ExecutionContextCreateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextCreateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextCreateMutation>(ExecutionContextCreateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextCreate', 'mutation');
    },
    executionContextDestroy(variables: ExecutionContextDestroyMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextDestroyMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextDestroyMutation>(ExecutionContextDestroyDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextDestroy', 'mutation');
    },
    executionContextList(variables?: ExecutionContextListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextListQuery>(ExecutionContextListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextList', 'query');
    },
    executionContextUpdate(variables: ExecutionContextUpdateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextUpdateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextUpdateMutation>(ExecutionContextUpdateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextUpdate', 'mutation');
    },
    getAuthModels(variables?: GetAuthModelsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthModelsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthModelsQuery>(GetAuthModelsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthModels', 'query');
    },
    getTemplateConnections(variables: GetTemplateConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetTemplateConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetTemplateConnectionsQuery>(GetTemplateConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getTemplateConnections', 'query');
    },
    getUserConnections(variables: GetUserConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserConnectionsQuery>(GetUserConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserConnections', 'query');
    },
    initConnection(variables: InitConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<InitConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<InitConnectionMutation>(InitConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'initConnection', 'mutation');
    },
    refreshSessionConnections(variables?: RefreshSessionConnectionsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RefreshSessionConnectionsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<RefreshSessionConnectionsMutation>(RefreshSessionConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'refreshSessionConnections', 'mutation');
    },
    setConnectionNavigatorSettings(variables: SetConnectionNavigatorSettingsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionNavigatorSettingsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionNavigatorSettingsMutation>(SetConnectionNavigatorSettingsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnectionNavigatorSettings', 'mutation');
    },
    testConnection(variables: TestConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TestConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TestConnectionMutation>(TestConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'testConnection', 'mutation');
    },
    testNetworkHandler(variables: TestNetworkHandlerMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TestNetworkHandlerMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TestNetworkHandlerMutation>(TestNetworkHandlerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'testNetworkHandler', 'mutation');
    },
    updateConnection(variables: UpdateConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateConnectionMutation>(UpdateConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateConnection', 'mutation');
    },
    exportDataFromContainer(variables: ExportDataFromContainerQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExportDataFromContainerQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExportDataFromContainerQuery>(ExportDataFromContainerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'exportDataFromContainer', 'query');
    },
    exportDataFromResults(variables: ExportDataFromResultsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExportDataFromResultsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExportDataFromResultsQuery>(ExportDataFromResultsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'exportDataFromResults', 'query');
    },
    getDataTransferProcessors(variables?: GetDataTransferProcessorsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetDataTransferProcessorsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetDataTransferProcessorsQuery>(GetDataTransferProcessorsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getDataTransferProcessors', 'query');
    },
    removeDataTransferFile(variables: RemoveDataTransferFileQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RemoveDataTransferFileQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<RemoveDataTransferFileQuery>(RemoveDataTransferFileDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'removeDataTransferFile', 'query');
    },
    navGetStructContainers(variables: NavGetStructContainersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavGetStructContainersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavGetStructContainersQuery>(NavGetStructContainersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navGetStructContainers', 'query');
    },
    getAsyncTaskInfo(variables: GetAsyncTaskInfoMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAsyncTaskInfoMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAsyncTaskInfoMutation>(GetAsyncTaskInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAsyncTaskInfo', 'mutation');
    },
    getNetworkHandlers(variables?: GetNetworkHandlersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetNetworkHandlersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetNetworkHandlersQuery>(GetNetworkHandlersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getNetworkHandlers', 'query');
    },
    asyncReadDataFromContainer(variables: AsyncReadDataFromContainerMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncReadDataFromContainerMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncReadDataFromContainerMutation>(AsyncReadDataFromContainerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncReadDataFromContainer', 'mutation');
    },
    asyncSqlExecuteQuery(variables: AsyncSqlExecuteQueryMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncSqlExecuteQueryMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncSqlExecuteQueryMutation>(AsyncSqlExecuteQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncSqlExecuteQuery', 'mutation');
    },
    asyncSqlExplainExecutionPlan(variables: AsyncSqlExplainExecutionPlanMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncSqlExplainExecutionPlanMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncSqlExplainExecutionPlanMutation>(AsyncSqlExplainExecutionPlanDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncSqlExplainExecutionPlan', 'mutation');
    },
    closeResult(variables: CloseResultMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CloseResultMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CloseResultMutation>(CloseResultDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'closeResult', 'mutation');
    },
    getResultsetDataURL(variables: GetResultsetDataUrlMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetResultsetDataUrlMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetResultsetDataUrlMutation>(GetResultsetDataUrlDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getResultsetDataURL', 'mutation');
    },
    getSqlExecuteTaskResults(variables: GetSqlExecuteTaskResultsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSqlExecuteTaskResultsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSqlExecuteTaskResultsMutation>(GetSqlExecuteTaskResultsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSqlExecuteTaskResults', 'mutation');
    },
    getSqlExecutionPlanResult(variables: GetSqlExecutionPlanResultMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSqlExecutionPlanResultMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSqlExecutionPlanResultMutation>(GetSqlExecutionPlanResultDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSqlExecutionPlanResult', 'mutation');
    },
    updateResultsDataBatch(variables: UpdateResultsDataBatchMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateResultsDataBatchMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateResultsDataBatchMutation>(UpdateResultsDataBatchDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateResultsDataBatch', 'mutation');
    },
    updateResultsDataBatchScript(variables: UpdateResultsDataBatchScriptMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateResultsDataBatchScriptMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateResultsDataBatchScriptMutation>(UpdateResultsDataBatchScriptDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateResultsDataBatchScript', 'mutation');
    },
    metadataGetNodeDDL(variables: MetadataGetNodeDdlQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<MetadataGetNodeDdlQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<MetadataGetNodeDdlQuery>(MetadataGetNodeDdlDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'metadataGetNodeDDL', 'query');
    },
    getChildrenDBObjectInfo(variables: GetChildrenDbObjectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetChildrenDbObjectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetChildrenDbObjectInfoQuery>(GetChildrenDbObjectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getChildrenDBObjectInfo', 'query');
    },
    getDBObjectInfo(variables: GetDbObjectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetDbObjectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetDbObjectInfoQuery>(GetDbObjectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getDBObjectInfo', 'query');
    },
    getNavNodeFullName(variables: GetNavNodeFullNameQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetNavNodeFullNameQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetNavNodeFullNameQuery>(GetNavNodeFullNameDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getNavNodeFullName', 'query');
    },
    navDeleteNodes(variables: NavDeleteNodesMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavDeleteNodesMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<NavDeleteNodesMutation>(NavDeleteNodesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navDeleteNodes', 'mutation');
    },
    navNodeChildren(variables: NavNodeChildrenQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavNodeChildrenQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavNodeChildrenQuery>(NavNodeChildrenDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navNodeChildren', 'query');
    },
    navNodeInfo(variables: NavNodeInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavNodeInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavNodeInfoQuery>(NavNodeInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navNodeInfo', 'query');
    },
    navRefreshNode(variables: NavRefreshNodeQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavRefreshNodeQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavRefreshNodeQuery>(NavRefreshNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navRefreshNode', 'query');
    },
    navRenameNode(variables: NavRenameNodeMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavRenameNodeMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<NavRenameNodeMutation>(NavRenameNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navRenameNode', 'mutation');
    },
    createResource(variables: CreateResourceMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateResourceMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateResourceMutation>(CreateResourceDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createResource', 'mutation');
    },
    deleteResource(variables: DeleteResourceMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteResourceMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteResourceMutation>(DeleteResourceDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteResource', 'mutation');
    },
    getProjectList(variables?: GetProjectListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetProjectListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetProjectListQuery>(GetProjectListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getProjectList', 'query');
    },
    getResourceList(variables: GetResourceListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetResourceListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetResourceListQuery>(GetResourceListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getResourceList', 'query');
    },
    readResource(variables: ReadResourceQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ReadResourceQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ReadResourceQuery>(ReadResourceDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'readResource', 'query');
    },
    writeResourceContent(variables: WriteResourceContentMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<WriteResourceContentMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<WriteResourceContentMutation>(WriteResourceContentDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'writeResourceContent', 'mutation');
    },
    configureServer(variables: ConfigureServerQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ConfigureServerQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ConfigureServerQuery>(ConfigureServerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'configureServer', 'query');
    },
    listFeatureSets(variables?: ListFeatureSetsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ListFeatureSetsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ListFeatureSetsQuery>(ListFeatureSetsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'listFeatureSets', 'query');
    },
    setDefaultNavigatorSettings(variables: SetDefaultNavigatorSettingsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetDefaultNavigatorSettingsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetDefaultNavigatorSettingsQuery>(SetDefaultNavigatorSettingsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setDefaultNavigatorSettings', 'query');
    },
    changeSessionLanguage(variables: ChangeSessionLanguageMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ChangeSessionLanguageMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ChangeSessionLanguageMutation>(ChangeSessionLanguageDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'changeSessionLanguage', 'mutation');
    },
    openSession(variables?: OpenSessionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<OpenSessionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<OpenSessionMutation>(OpenSessionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'openSession', 'mutation');
    },
    readSessionLog(variables: ReadSessionLogQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ReadSessionLogQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ReadSessionLogQuery>(ReadSessionLogDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'readSessionLog', 'query');
    },
    serverConfig(variables?: ServerConfigQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ServerConfigQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ServerConfigQuery>(ServerConfigDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'serverConfig', 'query');
    },
    sessionPermissions(variables?: SessionPermissionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SessionPermissionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SessionPermissionsQuery>(SessionPermissionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sessionPermissions', 'query');
    },
    sessionState(variables?: SessionStateQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SessionStateQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SessionStateQuery>(SessionStateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sessionState', 'query');
    },
    touchSession(variables?: TouchSessionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TouchSessionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TouchSessionMutation>(TouchSessionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'touchSession', 'mutation');
    },
    formatSqlQuery(variables: FormatSqlQueryQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<FormatSqlQueryQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<FormatSqlQueryQuery>(FormatSqlQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'formatSqlQuery', 'query');
    },
    parseSQLQuery(variables: ParseSqlQueryQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ParseSqlQueryQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ParseSqlQueryQuery>(ParseSqlQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'parseSQLQuery', 'query');
    },
    parseSQLScript(variables: ParseSqlScriptQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ParseSqlScriptQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ParseSqlScriptQuery>(ParseSqlScriptDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'parseSQLScript', 'query');
    },
    querySqlCompletionProposals(variables: QuerySqlCompletionProposalsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<QuerySqlCompletionProposalsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<QuerySqlCompletionProposalsQuery>(QuerySqlCompletionProposalsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'querySqlCompletionProposals', 'query');
    },
    querySqlDialectInfo(variables: QuerySqlDialectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<QuerySqlDialectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<QuerySqlDialectInfoQuery>(QuerySqlDialectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'querySqlDialectInfo', 'query');
    },
    sqlEntityQueryGenerators(variables: SqlEntityQueryGeneratorsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SqlEntityQueryGeneratorsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SqlEntityQueryGeneratorsQuery>(SqlEntityQueryGeneratorsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sqlEntityQueryGenerators', 'query');
    },
    sqlGenerateEntityQuery(variables: SqlGenerateEntityQueryQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SqlGenerateEntityQueryQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SqlGenerateEntityQueryQuery>(SqlGenerateEntityQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sqlGenerateEntityQuery', 'query');
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;