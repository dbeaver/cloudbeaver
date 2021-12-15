/* eslint-disable max-len */
import type { GraphQLClient } from 'graphql-request';
import type * as Dom from 'graphql-request/dist/types.dom';
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

export interface AdminAuthProviderConfiguration {
  description?: Maybe<Scalars['String']>;
  disabled: Scalars['Boolean'];
  displayName: Scalars['String'];
  iconURL?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  metadataLink?: Maybe<Scalars['String']>;
  parameters: Scalars['Object'];
  providerId: Scalars['ID'];
  signInLink?: Maybe<Scalars['String']>;
  signOutLink?: Maybe<Scalars['String']>;
}

export interface AdminConnectionGrantInfo {
  connectionId: Scalars['ID'];
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
  grantedConnections: AdminConnectionGrantInfo[];
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
  grantedConnections: AdminConnectionGrantInfo[];
  grantedRoles: Array<Scalars['ID']>;
  linkedAuthProviders: Array<Scalars['String']>;
  metaParameters: Scalars['Object'];
  origins: ObjectOrigin[];
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
  credentialParameters: AuthCredentialInfo[];
  description?: Maybe<Scalars['String']>;
  id?: Maybe<Scalars['String']>;
  label?: Maybe<Scalars['String']>;
}

export interface AuthProviderInfo {
  configurable: Scalars['Boolean'];
  configurations?: Maybe<AuthProviderConfiguration[]>;
  credentialProfiles: AuthProviderCredentialsProfile[];
  defaultProvider: Scalars['Boolean'];
  description?: Maybe<Scalars['String']>;
  icon?: Maybe<Scalars['ID']>;
  id: Scalars['ID'];
  label: Scalars['String'];
  requiredFeatures: Array<Scalars['String']>;
}

export interface ConnectionConfig {
  authModelId?: Maybe<Scalars['ID']>;
  connectionId?: Maybe<Scalars['String']>;
  credentials?: Maybe<Scalars['Object']>;
  dataSourceId?: Maybe<Scalars['ID']>;
  databaseName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  driverId?: Maybe<Scalars['ID']>;
  host?: Maybe<Scalars['String']>;
  name?: Maybe<Scalars['String']>;
  networkHandlersConfig?: Maybe<NetworkHandlerConfigInput[]>;
  port?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  providerProperties?: Maybe<Scalars['Object']>;
  readOnly?: Maybe<Scalars['Boolean']>;
  saveCredentials?: Maybe<Scalars['Boolean']>;
  template?: Maybe<Scalars['Boolean']>;
  templateId?: Maybe<Scalars['ID']>;
  url?: Maybe<Scalars['String']>;
  userName?: Maybe<Scalars['String']>;
  userPassword?: Maybe<Scalars['String']>;
}

export interface ConnectionInfo {
  authModel?: Maybe<Scalars['ID']>;
  authNeeded: Scalars['Boolean'];
  authProperties: ObjectPropertyInfo[];
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
  networkHandlersConfig: NetworkHandlerConfig[];
  nodePath?: Maybe<Scalars['String']>;
  origin: ObjectOrigin;
  port?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  provided: Scalars['Boolean'];
  providerProperties: Scalars['Object'];
  readOnly: Scalars['Boolean'];
  saveCredentials: Scalars['Boolean'];
  serverVersion?: Maybe<Scalars['String']>;
  supportedDataFormats: ResultDataFormat[];
  template: Scalars['Boolean'];
  url?: Maybe<Scalars['String']>;
  useUrl: Scalars['Boolean'];
}

export interface DataTransferParameters {
  filter?: Maybe<SqlDataFilter>;
  processorId: Scalars['ID'];
  processorProperties: Scalars['Object'];
  settings?: Maybe<Scalars['Object']>;
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
  properties: ObjectPropertyInfo[];
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
  filter?: Maybe<ObjectPropertyFilter>;
}

export interface DatabaseStructContainers {
  catalogList: DatabaseObjectInfo[];
  schemaList: DatabaseObjectInfo[];
}

export interface DriverInfo {
  /** @deprecated Field no longer supported */
  allowsEmptyPassword?: Maybe<Scalars['Boolean']>;
  anonymousAccess?: Maybe<Scalars['Boolean']>;
  applicableAuthModel: Array<Scalars['ID']>;
  applicableNetworkHandlers: Array<Maybe<Scalars['ID']>>;
  custom?: Maybe<Scalars['Boolean']>;
  defaultAuthModel: Scalars['ID'];
  defaultDatabase?: Maybe<Scalars['String']>;
  defaultPort?: Maybe<Scalars['String']>;
  defaultServer?: Maybe<Scalars['String']>;
  defaultUser?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  driverClassName?: Maybe<Scalars['String']>;
  driverInfoURL?: Maybe<Scalars['String']>;
  driverParameters: Scalars['Object'];
  driverProperties: ObjectPropertyInfo[];
  driverPropertiesURL?: Maybe<Scalars['String']>;
  embedded?: Maybe<Scalars['Boolean']>;
  icon?: Maybe<Scalars['String']>;
  iconBig?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  license?: Maybe<Scalars['String']>;
  licenseRequired?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  promotedScore?: Maybe<Scalars['Int']>;
  providerId?: Maybe<Scalars['ID']>;
  providerProperties: ObjectPropertyInfo[];
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
  containerNodePath: Scalars['ID'];
  contextId: Scalars['ID'];
  dataFormat?: Maybe<ResultDataFormat>;
  filter?: Maybe<SqlDataFilter>;
  resultId?: Maybe<Scalars['ID']>;
}

export interface MutationAsyncSqlExecuteQueryArgs {
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  dataFormat?: Maybe<ResultDataFormat>;
  filter?: Maybe<SqlDataFilter>;
  resultId?: Maybe<Scalars['ID']>;
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
  locale?: Maybe<Scalars['String']>;
}

export interface MutationCloseConnectionArgs {
  id: Scalars['ID'];
}

export interface MutationCopyConnectionFromNodeArgs {
  config?: Maybe<ConnectionConfig>;
  nodePath: Scalars['String'];
}

export interface MutationCreateConnectionArgs {
  config: ConnectionConfig;
}

export interface MutationCreateConnectionFromTemplateArgs {
  connectionName?: Maybe<Scalars['String']>;
  templateId: Scalars['ID'];
}

export interface MutationDeleteConnectionArgs {
  id: Scalars['ID'];
}

export interface MutationInitConnectionArgs {
  credentials?: Maybe<Scalars['Object']>;
  id: Scalars['ID'];
  networkCredentials?: Maybe<NetworkHandlerConfigInput[]>;
  saveCredentials?: Maybe<Scalars['Boolean']>;
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
  defaultLocale?: Maybe<Scalars['String']>;
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
  addedRows?: Maybe<SqlResultRow[]>;
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  deletedRows?: Maybe<SqlResultRow[]>;
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[]>;
}

export interface MutationUpdateResultsDataBatchScriptArgs {
  addedRows?: Maybe<SqlResultRow[]>;
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  deletedRows?: Maybe<SqlResultRow[]>;
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[]>;
}

export interface NavigatorNodeInfo {
  description?: Maybe<Scalars['String']>;
  features?: Maybe<Array<Scalars['String']>>;
  folder?: Maybe<Scalars['Boolean']>;
  hasChildren?: Maybe<Scalars['Boolean']>;
  icon?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  inline?: Maybe<Scalars['Boolean']>;
  name?: Maybe<Scalars['String']>;
  navigable?: Maybe<Scalars['Boolean']>;
  nodeDetails?: Maybe<ObjectPropertyInfo[]>;
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

export interface NetworkHandlerConfig {
  enabled: Scalars['Boolean'];
  id: Scalars['ID'];
  password?: Maybe<Scalars['String']>;
  properties: Scalars['Object'];
  savePassword: Scalars['Boolean'];
  userName?: Maybe<Scalars['String']>;
}

export interface NetworkHandlerConfigInput {
  enabled?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  password?: Maybe<Scalars['String']>;
  properties?: Maybe<Scalars['Object']>;
  savePassword?: Maybe<Scalars['Boolean']>;
  userName?: Maybe<Scalars['String']>;
}

export interface NetworkHandlerDescriptor {
  codeName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  label: Scalars['String'];
  properties: ObjectPropertyInfo[];
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
  details?: Maybe<ObjectPropertyInfo[]>;
  displayName: Scalars['String'];
  icon?: Maybe<Scalars['String']>;
  subType?: Maybe<Scalars['ID']>;
  type: Scalars['ID'];
}

export interface ObjectPropertyFilter {
  categories?: Maybe<Array<Scalars['String']>>;
  dataTypes?: Maybe<Array<Scalars['String']>>;
  features?: Maybe<Array<Scalars['String']>>;
  ids?: Maybe<Array<Scalars['String']>>;
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
  deleteAuthProviderConfiguration: Scalars['Boolean'];
  deleteConnectionConfiguration?: Maybe<Scalars['Boolean']>;
  deleteRole?: Maybe<Scalars['Boolean']>;
  deleteUser?: Maybe<Scalars['Boolean']>;
  deleteUserMetaParameter: Scalars['Boolean'];
  driverList: DriverInfo[];
  getConnectionSubjectAccess: AdminConnectionGrantInfo[];
  getSubjectConnectionAccess: AdminConnectionGrantInfo[];
  grantUserRole?: Maybe<Scalars['Boolean']>;
  listAuthProviderConfigurationParameters: ObjectPropertyInfo[];
  listAuthProviderConfigurations: AdminAuthProviderConfiguration[];
  listFeatureSets: WebFeatureSet[];
  listPermissions: Array<Maybe<AdminPermissionInfo>>;
  listRoles: Array<Maybe<AdminRoleInfo>>;
  listUserProfileProperties: ObjectPropertyInfo[];
  listUsers: Array<Maybe<AdminUserInfo>>;
  metadataGetNodeDDL?: Maybe<Scalars['String']>;
  navGetStructContainers: DatabaseStructContainers;
  navNodeChildren: NavigatorNodeInfo[];
  navNodeInfo: NavigatorNodeInfo;
  navNodeParents: NavigatorNodeInfo[];
  navRefreshNode?: Maybe<Scalars['Boolean']>;
  networkHandlers: NetworkHandlerDescriptor[];
  readSessionLog: LogEntry[];
  revokeUserRole?: Maybe<Scalars['Boolean']>;
  saveAuthProviderConfiguration: AdminAuthProviderConfiguration;
  saveUserMetaParameter: ObjectPropertyInfo;
  searchConnections: AdminConnectionSearchInfo[];
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
  sqlEntityQueryGenerators: SqlQueryGenerator[];
  sqlFormatQuery: Scalars['String'];
  sqlGenerateEntityQuery: Scalars['String'];
  sqlListContexts: Array<Maybe<SqlContextInfo>>;
  sqlSupportedOperations: DataTypeLogicalOperation[];
  templateConnections: ConnectionInfo[];
  tryFederatedLogin: UserAuthToken;
  updateConnectionConfiguration: ConnectionInfo;
  updateRole: AdminRoleInfo;
  userConnections: ConnectionInfo[];
}

export interface QueryAllConnectionsArgs {
  id?: Maybe<Scalars['ID']>;
}

export interface QueryAuthChangeLocalPasswordArgs {
  newPassword: Scalars['String'];
  oldPassword: Scalars['String'];
}

export interface QueryAuthLoginArgs {
  configuration?: Maybe<Scalars['ID']>;
  credentials: Scalars['Object'];
  linkUser?: Maybe<Scalars['Boolean']>;
  provider: Scalars['ID'];
}

export interface QueryAuthLogoutArgs {
  configuration?: Maybe<Scalars['ID']>;
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
  config?: Maybe<ConnectionConfig>;
  nodePath: Scalars['String'];
}

export interface QueryCreateConnectionConfigurationArgs {
  config: ConnectionConfig;
}

export interface QueryCreateRoleArgs {
  description?: Maybe<Scalars['String']>;
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
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
  id?: Maybe<Scalars['ID']>;
}

export interface QueryGetConnectionSubjectAccessArgs {
  connectionId?: Maybe<Scalars['ID']>;
}

export interface QueryGetSubjectConnectionAccessArgs {
  subjectId?: Maybe<Scalars['ID']>;
}

export interface QueryGrantUserRoleArgs {
  roleId: Scalars['ID'];
  userId: Scalars['ID'];
}

export interface QueryListAuthProviderConfigurationParametersArgs {
  providerId: Scalars['ID'];
}

export interface QueryListAuthProviderConfigurationsArgs {
  providerId?: Maybe<Scalars['ID']>;
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
  catalog?: Maybe<Scalars['ID']>;
  connectionId: Scalars['ID'];
}

export interface QueryNavNodeChildrenArgs {
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Int']>;
  onlyFolders?: Maybe<Scalars['Boolean']>;
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
  clearEntries?: Maybe<Scalars['Boolean']>;
  maxEntries?: Maybe<Scalars['Int']>;
}

export interface QueryRevokeUserRoleArgs {
  roleId: Scalars['ID'];
  userId: Scalars['ID'];
}

export interface QuerySaveAuthProviderConfigurationArgs {
  description?: Maybe<Scalars['String']>;
  disabled?: Maybe<Scalars['Boolean']>;
  displayName?: Maybe<Scalars['String']>;
  iconURL?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  parameters?: Maybe<Scalars['Object']>;
  providerId: Scalars['ID'];
}

export interface QuerySaveUserMetaParameterArgs {
  description?: Maybe<Scalars['String']>;
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
  maxResults?: Maybe<Scalars['Int']>;
  position: Scalars['Int'];
  query: Scalars['String'];
  simpleMode?: Maybe<Scalars['Boolean']>;
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
  connectionId?: Maybe<Scalars['ID']>;
  contextId?: Maybe<Scalars['ID']>;
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
  description?: Maybe<Scalars['String']>;
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
}

export interface QueryUserConnectionsArgs {
  id?: Maybe<Scalars['ID']>;
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
  constraints?: Maybe<Array<Maybe<SqlDataFilterConstraint>>>;
  limit?: Maybe<Scalars['Int']>;
  offset?: Maybe<Scalars['Float']>;
  orderBy?: Maybe<Scalars['String']>;
  where?: Maybe<Scalars['String']>;
}

export interface SqlDataFilterConstraint {
  attribute: Scalars['String'];
  criteria?: Maybe<Scalars['String']>;
  operator?: Maybe<Scalars['String']>;
  orderAsc?: Maybe<Scalars['Boolean']>;
  orderPosition?: Maybe<Scalars['Int']>;
  value?: Maybe<Scalars['Object']>;
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
  results: SqlQueryResults[];
  statusMessage?: Maybe<Scalars['String']>;
}

export interface SqlExecutionPlan {
  nodes: SqlExecutionPlanNode[];
  query: Scalars['String'];
}

export interface SqlExecutionPlanNode {
  condition?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  id: Scalars['ID'];
  kind: Scalars['String'];
  name?: Maybe<Scalars['String']>;
  parentId?: Maybe<Scalars['ID']>;
  properties: ObjectPropertyInfo[];
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
  supportedOperations: DataTypeLogicalOperation[];
  typeName?: Maybe<Scalars['String']>;
}

export interface SqlResultRow {
  data: Array<Maybe<Scalars['Object']>>;
  updateValues?: Maybe<Scalars['Object']>;
}

export interface SqlResultSet {
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  hasMoreData?: Maybe<Scalars['Boolean']>;
  id: Scalars['ID'];
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars['Object']>>>>>;
}

export interface ServerConfig {
  adminCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  /** @deprecated Field no longer supported */
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  configurationMode?: Maybe<Scalars['Boolean']>;
  defaultNavigatorSettings: NavigatorSettings;
  developmentMode?: Maybe<Scalars['Boolean']>;
  enabledAuthProviders: Array<Scalars['ID']>;
  enabledFeatures: Array<Scalars['ID']>;
  licenseRequired: Scalars['Boolean'];
  licenseValid: Scalars['Boolean'];
  localHostAddress?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  productConfiguration: Scalars['Object'];
  productInfo: ProductInfo;
  publicCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  rootURI: Scalars['String'];
  serverURL: Scalars['String'];
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  sessionExpireTime?: Maybe<Scalars['Int']>;
  supportedLanguages: ServerLanguage[];
  supportsConnectionBrowser?: Maybe<Scalars['Boolean']>;
  supportsCustomConnections?: Maybe<Scalars['Boolean']>;
  supportsWorkspaces?: Maybe<Scalars['Boolean']>;
  version: Scalars['String'];
  workspaceId: Scalars['ID'];
}

export interface ServerConfigInput {
  adminCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  adminName?: Maybe<Scalars['String']>;
  adminPassword?: Maybe<Scalars['String']>;
  anonymousAccessEnabled?: Maybe<Scalars['Boolean']>;
  authenticationEnabled?: Maybe<Scalars['Boolean']>;
  customConnectionsEnabled?: Maybe<Scalars['Boolean']>;
  enabledAuthProviders?: Maybe<Array<Scalars['ID']>>;
  enabledFeatures?: Maybe<Array<Scalars['ID']>>;
  publicCredentialsSaveEnabled?: Maybe<Scalars['Boolean']>;
  serverName?: Maybe<Scalars['String']>;
  serverURL?: Maybe<Scalars['String']>;
  sessionExpireTime?: Maybe<Scalars['Int']>;
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
  cacheExpired: Scalars['Boolean'];
  connections: ConnectionInfo[];
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
  authTokens: UserAuthToken[];
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

export interface AsyncTaskCancelMutation { result?: Maybe<boolean> }

export type CreateRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
}>;

export interface CreateRoleQuery { role: { roleId: string; roleName?: Maybe<string>; description?: Maybe<string> } }

export type DeleteRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
}>;

export interface DeleteRoleQuery { deleteRole?: Maybe<boolean> }

export type GetRoleGrantedUsersQueryVariables = Exact<{
  roleId: Scalars['ID'];
}>;

export interface GetRoleGrantedUsersQuery { role: Array<Maybe<{ grantedUsers: string[] }>> }

export type GetRolesListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export interface GetRolesListQuery { roles: Array<Maybe<{ roleId: string; roleName?: Maybe<string>; description?: Maybe<string> }>> }

export type UpdateRoleQueryVariables = Exact<{
  roleId: Scalars['ID'];
  roleName?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
}>;

export interface UpdateRoleQuery { role: { roleId: string; roleName?: Maybe<string>; description?: Maybe<string> } }

export type AuthChangeLocalPasswordQueryVariables = Exact<{
  oldPassword: Scalars['String'];
  newPassword: Scalars['String'];
}>;

export interface AuthChangeLocalPasswordQuery { authChangeLocalPassword: boolean }

export type AuthLoginQueryVariables = Exact<{
  provider: Scalars['ID'];
  credentials: Scalars['Object'];
  linkUser?: Maybe<Scalars['Boolean']>;
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface AuthLoginQuery { authToken: { authProvider: string; authConfiguration?: Maybe<string>; loginTime: any; message?: Maybe<string>; origin: { type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> } } }

export type AuthLogoutQueryVariables = Exact<{ [key: string]: never }>;

export interface AuthLogoutQuery { authLogout?: Maybe<boolean> }

export type DeleteAuthProviderConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export interface DeleteAuthProviderConfigurationQuery { deleteAuthProviderConfiguration: boolean }

export type GetActiveUserQueryVariables = Exact<{
  includeMetaParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface GetActiveUserQuery { user?: Maybe<{ userId: string; displayName?: Maybe<string>; linkedAuthProviders: string[]; metaParameters?: Maybe<any>; authTokens: Array<{ authProvider: string; authConfiguration?: Maybe<string>; loginTime: any; message?: Maybe<string>; origin: { type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> } }> }> }

export type GetAuthProviderConfigurationParametersQueryVariables = Exact<{
  providerId: Scalars['ID'];
}>;

export interface GetAuthProviderConfigurationParametersQuery { parameters: Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }> }

export type GetAuthProviderConfigurationsQueryVariables = Exact<{
  providerId?: Maybe<Scalars['ID']>;
}>;

export interface GetAuthProviderConfigurationsQuery { configurations: Array<{ providerId: string; id: string; displayName: string; disabled: boolean; iconURL?: Maybe<string>; description?: Maybe<string>; parameters: any; signInLink?: Maybe<string>; signOutLink?: Maybe<string>; metadataLink?: Maybe<string> }> }

export type GetAuthProvidersQueryVariables = Exact<{ [key: string]: never }>;

export interface GetAuthProvidersQuery { providers: Array<{ id: string; label: string; icon?: Maybe<string>; description?: Maybe<string>; defaultProvider: boolean; configurable: boolean; requiredFeatures: string[]; configurations?: Maybe<Array<{ id: string; displayName: string; iconURL?: Maybe<string>; description?: Maybe<string>; signInLink?: Maybe<string>; signOutLink?: Maybe<string>; metadataLink?: Maybe<string> }>>; credentialProfiles: Array<{ id?: Maybe<string>; label?: Maybe<string>; description?: Maybe<string>; credentialParameters: Array<{ id: string; displayName: string; description?: Maybe<string>; admin: boolean; user: boolean; identifying: boolean; possibleValues?: Maybe<Array<Maybe<string>>>; encryption?: Maybe<AuthCredentialEncryption> }> }> }> }

export type GetUserProfilePropertiesQueryVariables = Exact<{ [key: string]: never }>;

export interface GetUserProfilePropertiesQuery { properties: Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }> }

export type SaveAuthProviderConfigurationQueryVariables = Exact<{
  providerId: Scalars['ID'];
  id: Scalars['ID'];
  displayName?: Maybe<Scalars['String']>;
  disabled?: Maybe<Scalars['Boolean']>;
  iconURL?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  parameters?: Maybe<Scalars['Object']>;
}>;

export interface SaveAuthProviderConfigurationQuery { configuration: { providerId: string; id: string; displayName: string; disabled: boolean; iconURL?: Maybe<string>; description?: Maybe<string>; parameters: any; signInLink?: Maybe<string>; signOutLink?: Maybe<string>; metadataLink?: Maybe<string> } }

export type SaveUserMetaParametersQueryVariables = Exact<{
  userId: Scalars['ID'];
  parameters: Scalars['Object'];
}>;

export interface SaveUserMetaParametersQuery { setUserMetaParameterValues: boolean }

export type CreateUserQueryVariables = Exact<{
  userId: Scalars['ID'];
  includeMetaParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface CreateUserQuery { user: { userId: string; grantedRoles: string[]; linkedAuthProviders: string[]; metaParameters?: Maybe<any>; origins: Array<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }> } }

export type DeleteUserQueryVariables = Exact<{
  userId: Scalars['ID'];
}>;

export interface DeleteUserQuery { deleteUser?: Maybe<boolean> }

export type DeleteUserMetaParameterQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export interface DeleteUserMetaParameterQuery { state: boolean }

export type GetPermissionsListQueryVariables = Exact<{
  roleId?: Maybe<Scalars['ID']>;
}>;

export interface GetPermissionsListQuery { permissions: Array<Maybe<{ id: string; label?: Maybe<string>; description?: Maybe<string>; provider: string; category?: Maybe<string> }>> }

export type GetUserGrantedConnectionsQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
}>;

export interface GetUserGrantedConnectionsQuery { grantedConnections: Array<{ connectionId: string; subjectId: string; subjectType: AdminSubjectType }> }

export type GetUsersListQueryVariables = Exact<{
  userId?: Maybe<Scalars['ID']>;
  includeMetaParameters: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
}>;

export interface GetUsersListQuery { users: Array<Maybe<{ userId: string; grantedRoles: string[]; linkedAuthProviders: string[]; metaParameters?: Maybe<any>; origins: Array<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }> }>> }

export type GrantUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;

export interface GrantUserRoleQuery { grantUserRole?: Maybe<boolean> }

export type RevokeUserRoleQueryVariables = Exact<{
  userId: Scalars['ID'];
  roleId: Scalars['ID'];
}>;

export interface RevokeUserRoleQuery { revokeUserRole?: Maybe<boolean> }

export type SetConnectionsQueryVariables = Exact<{
  userId: Scalars['ID'];
  connections: Array<Scalars['ID']> | Scalars['ID'];
}>;

export interface SetConnectionsQuery { grantedConnections?: Maybe<boolean> }

export type SetUserCredentialsQueryVariables = Exact<{
  userId: Scalars['ID'];
  providerId: Scalars['ID'];
  credentials: Scalars['Object'];
}>;

export interface SetUserCredentialsQuery { setUserCredentials?: Maybe<boolean> }

export type SetUserMetaParameterQueryVariables = Exact<{
  id: Scalars['ID'];
  displayName: Scalars['String'];
  description?: Maybe<Scalars['String']>;
  required: Scalars['Boolean'];
}>;

export interface SetUserMetaParameterQuery { parameter: { id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number } }

export type UpdateUserProfilePropertiesQueryVariables = Exact<{
  userId: Scalars['ID'];
  parameters: Scalars['Object'];
}>;

export interface UpdateUserProfilePropertiesQuery { state: boolean }

export type CreateConnectionConfigurationQueryVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionConfigurationQuery { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type CreateConnectionConfigurationFromNodeQueryVariables = Exact<{
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionConfigurationFromNodeQuery { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type DeleteConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
}>;

export interface DeleteConnectionConfigurationQuery { deleteConnectionConfiguration?: Maybe<boolean> }

export type GetConnectionAccessQueryVariables = Exact<{
  connectionId?: Maybe<Scalars['ID']>;
}>;

export interface GetConnectionAccessQuery { subjects: Array<{ connectionId: string; subjectId: string; subjectType: AdminSubjectType }> }

export type GetConnectionsQueryVariables = Exact<{
  id?: Maybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetConnectionsQuery { connections: Array<{ id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> }

export type GetSubjectConnectionAccessQueryVariables = Exact<{
  subjectId?: Maybe<Scalars['ID']>;
}>;

export interface GetSubjectConnectionAccessQuery { grantInfo: Array<{ connectionId: string; subjectId: string; subjectType: AdminSubjectType }> }

export type SearchDatabasesQueryVariables = Exact<{
  hosts: Array<Scalars['String']> | Scalars['String'];
}>;

export interface SearchDatabasesQuery { databases: Array<{ displayName: string; host: string; port: number; possibleDrivers: string[]; defaultDriver: string }> }

export type SetConnectionAccessQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  subjects: Array<Scalars['ID']> | Scalars['ID'];
}>;

export interface SetConnectionAccessQuery { setConnectionSubjectAccess?: Maybe<boolean> }

export type SetSubjectConnectionAccessQueryVariables = Exact<{
  subjectId: Scalars['ID'];
  connections: Array<Scalars['ID']> | Scalars['ID'];
}>;

export interface SetSubjectConnectionAccessQuery { setSubjectConnectionAccess?: Maybe<boolean> }

export type UpdateConnectionConfigurationQueryVariables = Exact<{
  id: Scalars['ID'];
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface UpdateConnectionConfigurationQuery { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type CloseConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CloseConnectionMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type CreateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type CreateConnectionFromNodeMutationVariables = Exact<{
  nodePath: Scalars['String'];
  config?: Maybe<ConnectionConfig>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionFromNodeMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type CreateConnectionFromTemplateMutationVariables = Exact<{
  templateId: Scalars['ID'];
  connectionName: Scalars['String'];
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface CreateConnectionFromTemplateMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type DeleteConnectionMutationVariables = Exact<{
  id: Scalars['ID'];
}>;

export interface DeleteConnectionMutation { deleteConnection: boolean }

export type DriverListQueryVariables = Exact<{
  driverId?: Maybe<Scalars['ID']>;
  includeProviderProperties: Scalars['Boolean'];
  includeDriverProperties: Scalars['Boolean'];
  includeDriverParameters: Scalars['Boolean'];
}>;

export interface DriverListQuery { drivers: Array<{ id: string; name?: Maybe<string>; icon?: Maybe<string>; description?: Maybe<string>; defaultPort?: Maybe<string>; defaultDatabase?: Maybe<string>; defaultServer?: Maybe<string>; defaultUser?: Maybe<string>; sampleURL?: Maybe<string>; embedded?: Maybe<boolean>; anonymousAccess?: Maybe<boolean>; promotedScore?: Maybe<number>; defaultAuthModel: string; applicableNetworkHandlers: Array<Maybe<string>>; driverParameters?: Maybe<any>; providerProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; length: ObjectPropertyLength; features: string[]; order: number }>>; driverProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>> }>> }> }

export type ExecutionContextCreateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['String']>;
  defaultSchema?: Maybe<Scalars['String']>;
}>;

export interface ExecutionContextCreateMutation { context: { id: string; connectionId: string; defaultCatalog?: Maybe<string>; defaultSchema?: Maybe<string> } }

export type ExecutionContextDestroyMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
}>;

export interface ExecutionContextDestroyMutation { sqlContextDestroy: boolean }

export type ExecutionContextListQueryVariables = Exact<{
  connectionId?: Maybe<Scalars['ID']>;
  contextId?: Maybe<Scalars['ID']>;
}>;

export interface ExecutionContextListQuery { contexts: Array<Maybe<{ id: string; connectionId: string; defaultCatalog?: Maybe<string>; defaultSchema?: Maybe<string> }>> }

export type ExecutionContextUpdateMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  defaultCatalog?: Maybe<Scalars['ID']>;
  defaultSchema?: Maybe<Scalars['ID']>;
}>;

export interface ExecutionContextUpdateMutation { context: boolean }

export type GetAuthModelsQueryVariables = Exact<{ [key: string]: never }>;

export interface GetAuthModelsQuery { models: Array<{ id: string; displayName: string; description?: Maybe<string>; icon?: Maybe<string>; properties: Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }> }> }

export type GetTemplateConnectionsQueryVariables = Exact<{
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetTemplateConnectionsQuery { connections: Array<{ id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> }

export type GetUserConnectionsQueryVariables = Exact<{
  id?: Maybe<Scalars['ID']>;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface GetUserConnectionsQuery { connections: Array<{ id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }> }

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

export interface InitConnectionMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type RefreshSessionConnectionsMutationVariables = Exact<{ [key: string]: never }>;

export interface RefreshSessionConnectionsMutation { refreshSessionConnections?: Maybe<boolean> }

export type SetConnectionNavigatorSettingsMutationVariables = Exact<{
  id: Scalars['ID'];
  settings: NavigatorSettingsInput;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface SetConnectionNavigatorSettingsMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type TestConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
}>;

export interface TestConnectionMutation { connection: { id: string; connectTime?: Maybe<string>; serverVersion?: Maybe<string>; clientVersion?: Maybe<string>; connectionError?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type TestNetworkHandlerMutationVariables = Exact<{
  config: NetworkHandlerConfigInput;
}>;

export interface TestNetworkHandlerMutation { info: { message?: Maybe<string>; clientVersion?: Maybe<string>; serverVersion?: Maybe<string> } }

export type UpdateConnectionMutationVariables = Exact<{
  config: ConnectionConfig;
  includeOrigin: Scalars['Boolean'];
  customIncludeOriginDetails: Scalars['Boolean'];
  includeAuthProperties: Scalars['Boolean'];
  customIncludeNetworkHandlerCredentials: Scalars['Boolean'];
}>;

export interface UpdateConnectionMutation { connection: { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } } }

export type ExportDataFromContainerQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export interface ExportDataFromContainerQuery { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type ExportDataFromResultsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  parameters: DataTransferParameters;
}>;

export interface ExportDataFromResultsQuery { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type GetDataTransferProcessorsQueryVariables = Exact<{ [key: string]: never }>;

export interface GetDataTransferProcessorsQuery { processors: Array<{ id: string; name?: Maybe<string>; description?: Maybe<string>; fileExtension?: Maybe<string>; appFileExtension?: Maybe<string>; appName?: Maybe<string>; order: number; icon?: Maybe<string>; isBinary?: Maybe<boolean>; isHTML?: Maybe<boolean>; properties?: Maybe<Array<Maybe<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; length: ObjectPropertyLength; features: string[]; order: number }>>> }> }

export type RemoveDataTransferFileQueryVariables = Exact<{
  dataFileId: Scalars['String'];
}>;

export interface RemoveDataTransferFileQuery { result?: Maybe<boolean> }

export type NavGetStructContainersQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  catalogId?: Maybe<Scalars['ID']>;
}>;

export interface NavGetStructContainersQuery { navGetStructContainers: { catalogList: Array<{ name?: Maybe<string>; description?: Maybe<string>; type?: Maybe<string>; features?: Maybe<string[]> }>; schemaList: Array<{ name?: Maybe<string>; description?: Maybe<string>; type?: Maybe<string>; features?: Maybe<string[]> }> } }

export type FormatSqlQueryQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
}>;

export interface FormatSqlQueryQuery { query: string }

export interface AdminRoleInfoFragment { roleId: string; roleName?: Maybe<string>; description?: Maybe<string> }

export interface AdminUserInfoFragment { userId: string; grantedRoles: string[]; linkedAuthProviders: string[]; metaParameters?: Maybe<any>; origins: Array<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }> }

export interface AllNavigatorSettingsFragment { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean }

export interface AsyncTaskInfoFragment { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> }

export interface AuthProviderConfigurationParametersFragment { id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }

export interface AuthTokenFragment { authProvider: string; authConfiguration?: Maybe<string>; loginTime: any; message?: Maybe<string>; origin: { type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> } }

export interface DatabaseConnectionFragment { id: string; name: string; description?: Maybe<string>; driverId: string; template: boolean; connected: boolean; provided: boolean; useUrl: boolean; readOnly: boolean; saveCredentials: boolean; folder?: Maybe<string>; nodePath?: Maybe<string>; host?: Maybe<string>; port?: Maybe<string>; databaseName?: Maybe<string>; url?: Maybe<string>; properties?: Maybe<any>; providerProperties: any; features: string[]; supportedDataFormats: ResultDataFormat[]; authNeeded: boolean; authModel?: Maybe<string>; origin?: Maybe<{ type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }>; authProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>>; networkHandlersConfig: Array<{ id: string; enabled: boolean; userName?: Maybe<string>; password?: Maybe<string>; savePassword: boolean; properties?: Maybe<any> }>; navigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean } }

export interface DatabaseDriverFragment { id: string; name?: Maybe<string>; icon?: Maybe<string>; description?: Maybe<string>; defaultPort?: Maybe<string>; defaultDatabase?: Maybe<string>; defaultServer?: Maybe<string>; defaultUser?: Maybe<string>; sampleURL?: Maybe<string>; embedded?: Maybe<boolean>; anonymousAccess?: Maybe<boolean>; promotedScore?: Maybe<number>; defaultAuthModel: string; applicableNetworkHandlers: Array<Maybe<string>>; driverParameters?: Maybe<any>; providerProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; length: ObjectPropertyLength; features: string[]; order: number }>>; driverProperties?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>> }>> }

export interface NavNodeDbObjectInfoFragment { id: string; object?: Maybe<{ type?: Maybe<string>; features?: Maybe<string[]>; properties?: Maybe<Array<Maybe<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>>> }> }

export interface NavNodeInfoFragment { id: string; name?: Maybe<string>; hasChildren?: Maybe<boolean>; nodeType?: Maybe<string>; icon?: Maybe<string>; folder?: Maybe<boolean>; inline?: Maybe<boolean>; navigable?: Maybe<boolean>; features?: Maybe<string[]>; object?: Maybe<{ features?: Maybe<string[]> }>; nodeDetails?: Maybe<Array<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>> }

export interface NavNodePropertiesFragment { id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }

export interface ObjectOriginInfoFragment { type: string; subType?: Maybe<string>; displayName: string; icon?: Maybe<string>; details?: Maybe<Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; defaultValue?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; value?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }>> }

export interface SessionStateFragment { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string }

export interface UserConnectionAuthPropertiesFragment { id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; length: ObjectPropertyLength; features: string[]; order: number }

export interface UserConnectionNetworkHandlerPropertiesFragment { id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; order: number; length: ObjectPropertyLength; features: string[] }

export type GetAsyncTaskInfoMutationVariables = Exact<{
  taskId: Scalars['String'];
  removeOnFinish: Scalars['Boolean'];
}>;

export interface GetAsyncTaskInfoMutation { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type GetNetworkHandlersQueryVariables = Exact<{ [key: string]: never }>;

export interface GetNetworkHandlersQuery { handlers: Array<{ id: string; codeName: string; label: string; description?: Maybe<string>; secured: boolean; type?: Maybe<NetworkHandlerType>; properties: Array<{ id?: Maybe<string>; displayName?: Maybe<string>; description?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; value?: Maybe<any>; validValues?: Maybe<Array<Maybe<any>>>; defaultValue?: Maybe<any>; order: number; length: ObjectPropertyLength; features: string[] }> }> }

export type AsyncReadDataFromContainerMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  containerNodePath: Scalars['ID'];
  resultId?: Maybe<Scalars['ID']>;
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export interface AsyncReadDataFromContainerMutation { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type AsyncSqlExecuteQueryMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  resultId?: Maybe<Scalars['ID']>;
  filter?: Maybe<SqlDataFilter>;
  dataFormat?: Maybe<ResultDataFormat>;
}>;

export interface AsyncSqlExecuteQueryMutation { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; errorType?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type AsyncSqlExplainExecutionPlanMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  query: Scalars['String'];
  configuration: Scalars['Object'];
}>;

export interface AsyncSqlExplainExecutionPlanMutation { taskInfo: { id: string; name?: Maybe<string>; running: boolean; status?: Maybe<string>; taskResult?: Maybe<any>; error?: Maybe<{ message?: Maybe<string>; errorCode?: Maybe<string>; stackTrace?: Maybe<string> }> } }

export type CloseResultMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultId: Scalars['ID'];
}>;

export interface CloseResultMutation { result: boolean }

export type GetSqlExecuteTaskResultsMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;

export interface GetSqlExecuteTaskResultsMutation { result: { duration: number; statusMessage?: Maybe<string>; filterText?: Maybe<string>; results: Array<{ title?: Maybe<string>; updateRowCount?: Maybe<number>; sourceQuery?: Maybe<string>; dataFormat?: Maybe<ResultDataFormat>; resultSet?: Maybe<{ id: string; rows?: Maybe<Array<Maybe<Array<Maybe<any>>>>>; hasMoreData?: Maybe<boolean>; columns?: Maybe<Array<Maybe<{ dataKind?: Maybe<string>; entityName?: Maybe<string>; fullTypeName?: Maybe<string>; icon?: Maybe<string>; label?: Maybe<string>; maxLength?: Maybe<number>; name?: Maybe<string>; position: number; precision?: Maybe<number>; required: boolean; readOnly: boolean; readOnlyStatus?: Maybe<string>; scale?: Maybe<number>; typeName?: Maybe<string>; supportedOperations: Array<{ id: string; expression: string; argumentCount?: Maybe<number> }> }>>> }> }> } }

export type GetSqlExecutionPlanResultMutationVariables = Exact<{
  taskId: Scalars['ID'];
}>;

export interface GetSqlExecutionPlanResultMutation { result: { query: string; nodes: Array<{ id: string; parentId?: Maybe<string>; kind: string; name?: Maybe<string>; type: string; condition?: Maybe<string>; description?: Maybe<string>; properties: Array<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }> }> } }

export type UpdateResultsDataBatchMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  deletedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  addedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
}>;

export interface UpdateResultsDataBatchMutation { result: { duration: number; filterText?: Maybe<string>; results: Array<{ updateRowCount?: Maybe<number>; resultSet?: Maybe<{ id: string; rows?: Maybe<Array<Maybe<Array<Maybe<any>>>>> }> }> } }

export type UpdateResultsDataBatchScriptMutationVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  resultsId: Scalars['ID'];
  updatedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  deletedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
  addedRows?: Maybe<SqlResultRow[] | SqlResultRow>;
}>;

export interface UpdateResultsDataBatchScriptMutation { result: string }

export type MetadataGetNodeDdlQueryVariables = Exact<{
  nodeId: Scalars['ID'];
}>;

export interface MetadataGetNodeDdlQuery { metadataGetNodeDDL?: Maybe<string> }

export type GetChildrenDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export interface GetChildrenDbObjectInfoQuery { dbObjects: Array<{ id: string; object?: Maybe<{ type?: Maybe<string>; features?: Maybe<string[]>; properties?: Maybe<Array<Maybe<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>>> }> }> }

export type GetDbObjectInfoQueryVariables = Exact<{
  navNodeId: Scalars['ID'];
  filter?: Maybe<ObjectPropertyFilter>;
}>;

export interface GetDbObjectInfoQuery { objectInfo: { id: string; object?: Maybe<{ type?: Maybe<string>; features?: Maybe<string[]>; properties?: Maybe<Array<Maybe<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>>> }> } }

export type NavDeleteNodesMutationVariables = Exact<{
  nodePaths: Array<Scalars['ID']> | Scalars['ID'];
}>;

export interface NavDeleteNodesMutation { navDeleteNodes?: Maybe<number> }

export type NavNodeChildrenQueryVariables = Exact<{
  parentPath: Scalars['ID'];
  withDetails: Scalars['Boolean'];
}>;

export interface NavNodeChildrenQuery { navNodeChildren: Array<{ id: string; name?: Maybe<string>; hasChildren?: Maybe<boolean>; nodeType?: Maybe<string>; icon?: Maybe<string>; folder?: Maybe<boolean>; inline?: Maybe<boolean>; navigable?: Maybe<boolean>; features?: Maybe<string[]>; object?: Maybe<{ features?: Maybe<string[]> }>; nodeDetails?: Maybe<Array<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>> }>; navNodeInfo: { id: string; name?: Maybe<string>; hasChildren?: Maybe<boolean>; nodeType?: Maybe<string>; icon?: Maybe<string>; folder?: Maybe<boolean>; inline?: Maybe<boolean>; navigable?: Maybe<boolean>; features?: Maybe<string[]>; object?: Maybe<{ features?: Maybe<string[]> }>; nodeDetails?: Maybe<Array<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>> } }

export type NavNodeInfoQueryVariables = Exact<{
  nodePath: Scalars['ID'];
  withDetails: Scalars['Boolean'];
}>;

export interface NavNodeInfoQuery { navNodeInfo: { id: string; name?: Maybe<string>; hasChildren?: Maybe<boolean>; nodeType?: Maybe<string>; icon?: Maybe<string>; folder?: Maybe<boolean>; inline?: Maybe<boolean>; navigable?: Maybe<boolean>; features?: Maybe<string[]>; object?: Maybe<{ features?: Maybe<string[]> }>; nodeDetails?: Maybe<Array<{ id?: Maybe<string>; category?: Maybe<string>; dataType?: Maybe<string>; description?: Maybe<string>; displayName?: Maybe<string>; length: ObjectPropertyLength; features: string[]; value?: Maybe<any>; order: number }>> } }

export type NavRefreshNodeQueryVariables = Exact<{
  nodePath: Scalars['ID'];
}>;

export interface NavRefreshNodeQuery { navRefreshNode?: Maybe<boolean> }

export type NavRenameNodeMutationVariables = Exact<{
  nodePath: Scalars['ID'];
  newName: Scalars['String'];
}>;

export interface NavRenameNodeMutation { navRenameNode?: Maybe<string> }

export type QuerySqlCompletionProposalsQueryVariables = Exact<{
  connectionId: Scalars['ID'];
  contextId: Scalars['ID'];
  position: Scalars['Int'];
  query: Scalars['String'];
  simple?: Maybe<Scalars['Boolean']>;
  maxResults?: Maybe<Scalars['Int']>;
}>;

export interface QuerySqlCompletionProposalsQuery { sqlCompletionProposals?: Maybe<Array<Maybe<{ cursorPosition?: Maybe<number>; displayString: string; icon?: Maybe<string>; nodePath?: Maybe<string>; replacementLength: number; replacementOffset: number; replacementString: string; score?: Maybe<number>; type: string }>>> }

export type QuerySqlDialectInfoQueryVariables = Exact<{
  connectionId: Scalars['ID'];
}>;

export interface QuerySqlDialectInfoQuery { dialect?: Maybe<{ name: string; dataTypes: Array<Maybe<string>>; functions: Array<Maybe<string>>; reservedWords: Array<Maybe<string>>; quoteStrings: Array<Maybe<Array<Maybe<string>>>>; singleLineComments: Array<Maybe<string>>; multiLineComments: Array<Maybe<Array<Maybe<string>>>>; catalogSeparator?: Maybe<string>; structSeparator?: Maybe<string>; scriptDelimiter?: Maybe<string>; supportsExplainExecutionPlan: boolean }> }

export type ConfigureServerQueryVariables = Exact<{
  configuration: ServerConfigInput;
}>;

export interface ConfigureServerQuery { configureServer: boolean }

export type ListFeatureSetsQueryVariables = Exact<{ [key: string]: never }>;

export interface ListFeatureSetsQuery { features: Array<{ id: string; label: string; description?: Maybe<string>; icon?: Maybe<string>; enabled: boolean }> }

export type SetDefaultNavigatorSettingsQueryVariables = Exact<{
  settings: NavigatorSettingsInput;
}>;

export interface SetDefaultNavigatorSettingsQuery { setDefaultNavigatorSettings: boolean }

export type ChangeSessionLanguageMutationVariables = Exact<{
  locale: Scalars['String'];
}>;

export interface ChangeSessionLanguageMutation { changeSessionLanguage?: Maybe<boolean> }

export type OpenSessionMutationVariables = Exact<{
  defaultLocale?: Maybe<Scalars['String']>;
}>;

export interface OpenSessionMutation { session: { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string } }

export type ReadSessionLogQueryVariables = Exact<{
  maxEntries: Scalars['Int'];
  clearEntries: Scalars['Boolean'];
}>;

export interface ReadSessionLogQuery { log: Array<{ time?: Maybe<any>; type: string; message?: Maybe<string>; stackTrace?: Maybe<string> }> }

export type ServerConfigQueryVariables = Exact<{ [key: string]: never }>;

export interface ServerConfigQuery { serverConfig: { name: string; version: string; workspaceId: string; serverURL: string; rootURI: string; productConfiguration: any; supportsCustomConnections?: Maybe<boolean>; supportsConnectionBrowser?: Maybe<boolean>; supportsWorkspaces?: Maybe<boolean>; sessionExpireTime?: Maybe<number>; anonymousAccessEnabled?: Maybe<boolean>; adminCredentialsSaveEnabled?: Maybe<boolean>; publicCredentialsSaveEnabled?: Maybe<boolean>; licenseRequired: boolean; licenseValid: boolean; configurationMode?: Maybe<boolean>; developmentMode?: Maybe<boolean>; enabledFeatures: string[]; enabledAuthProviders: string[]; supportedLanguages: Array<{ isoCode: string; displayName?: Maybe<string>; nativeName?: Maybe<string> }>; defaultNavigatorSettings: { showSystemObjects: boolean; showUtilityObjects: boolean; showOnlyEntities: boolean; mergeEntities: boolean; hideFolders: boolean; hideSchemas: boolean; hideVirtualModel: boolean }; productInfo: { id: string; version: string; latestVersionInfo?: Maybe<string>; name: string; description?: Maybe<string>; buildTime: string; releaseTime: string; licenseInfo?: Maybe<string> } } }

export type SessionPermissionsQueryVariables = Exact<{ [key: string]: never }>;

export interface SessionPermissionsQuery { permissions: Array<Maybe<string>> }

export type SessionStateQueryVariables = Exact<{ [key: string]: never }>;

export interface SessionStateQuery { sessionState: { createTime: string; lastAccessTime: string; cacheExpired: boolean; locale: string } }

export type TouchSessionMutationVariables = Exact<{ [key: string]: never }>;

export interface TouchSessionMutation { touchSession?: Maybe<boolean> }

export type SqlEntityQueryGeneratorsQueryVariables = Exact<{
  nodePathList: Array<Scalars['String']> | Scalars['String'];
}>;

export interface SqlEntityQueryGeneratorsQuery { generators: Array<{ id: string; label: string; description?: Maybe<string>; order: number; multiObject: boolean }> }

export type SqlGenerateEntityQueryQueryVariables = Exact<{
  generatorId: Scalars['String'];
  options: Scalars['Object'];
  nodePathList: Array<Scalars['String']> | Scalars['String'];
}>;

export interface SqlGenerateEntityQueryQuery { sqlGenerateEntityQuery: string }

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
    query getActiveUser($includeMetaParameters: Boolean!, $customIncludeOriginDetails: Boolean!) {
  user: activeUser {
    userId
    displayName
    linkedAuthProviders
    metaParameters @include(if: $includeMetaParameters)
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
export const FormatSqlQueryDocument = `
    query formatSqlQuery($connectionId: ID!, $contextId: ID!, $query: String!) {
  query: sqlFormatQuery(
    connectionId: $connectionId
    contextId: $contextId
    query: $query
  )
}
    `;
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
export const NavDeleteNodesDocument = `
    mutation navDeleteNodes($nodePaths: [ID!]!) {
  navDeleteNodes(nodePaths: $nodePaths)
}
    `;
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
export const NavRenameNodeDocument = `
    mutation navRenameNode($nodePath: ID!, $newName: String!) {
  navRenameNode(nodePath: $nodePath, newName: $newName)
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

export type SdkFunctionWrapper = <T>(action: (requestHeaders?: Record<string, string>) => Promise<T>, operationName: string) => Promise<T>;

const defaultWrapper: SdkFunctionWrapper = (action, _operationName) => action();

export function getSdk(client: GraphQLClient, withWrapper: SdkFunctionWrapper = defaultWrapper) {
  return {
    asyncTaskCancel(variables: AsyncTaskCancelMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncTaskCancelMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncTaskCancelMutation>(AsyncTaskCancelDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncTaskCancel');
    },
    createRole(variables: CreateRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateRoleQuery>(CreateRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createRole');
    },
    deleteRole(variables: DeleteRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteRoleQuery>(DeleteRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteRole');
    },
    getRoleGrantedUsers(variables: GetRoleGrantedUsersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetRoleGrantedUsersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetRoleGrantedUsersQuery>(GetRoleGrantedUsersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getRoleGrantedUsers');
    },
    getRolesList(variables?: GetRolesListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetRolesListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetRolesListQuery>(GetRolesListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getRolesList');
    },
    updateRole(variables: UpdateRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateRoleQuery>(UpdateRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateRole');
    },
    authChangeLocalPassword(variables: AuthChangeLocalPasswordQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthChangeLocalPasswordQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthChangeLocalPasswordQuery>(AuthChangeLocalPasswordDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authChangeLocalPassword');
    },
    authLogin(variables: AuthLoginQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthLoginQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthLoginQuery>(AuthLoginDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authLogin');
    },
    authLogout(variables?: AuthLogoutQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AuthLogoutQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<AuthLogoutQuery>(AuthLogoutDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'authLogout');
    },
    deleteAuthProviderConfiguration(variables: DeleteAuthProviderConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteAuthProviderConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteAuthProviderConfigurationQuery>(DeleteAuthProviderConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteAuthProviderConfiguration');
    },
    getActiveUser(variables: GetActiveUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetActiveUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetActiveUserQuery>(GetActiveUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getActiveUser');
    },
    getAuthProviderConfigurationParameters(variables: GetAuthProviderConfigurationParametersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProviderConfigurationParametersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProviderConfigurationParametersQuery>(GetAuthProviderConfigurationParametersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviderConfigurationParameters');
    },
    getAuthProviderConfigurations(variables?: GetAuthProviderConfigurationsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProviderConfigurationsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProviderConfigurationsQuery>(GetAuthProviderConfigurationsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviderConfigurations');
    },
    getAuthProviders(variables?: GetAuthProvidersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthProvidersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthProvidersQuery>(GetAuthProvidersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthProviders');
    },
    getUserProfileProperties(variables?: GetUserProfilePropertiesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserProfilePropertiesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserProfilePropertiesQuery>(GetUserProfilePropertiesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserProfileProperties');
    },
    saveAuthProviderConfiguration(variables: SaveAuthProviderConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SaveAuthProviderConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SaveAuthProviderConfigurationQuery>(SaveAuthProviderConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'saveAuthProviderConfiguration');
    },
    saveUserMetaParameters(variables: SaveUserMetaParametersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SaveUserMetaParametersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SaveUserMetaParametersQuery>(SaveUserMetaParametersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'saveUserMetaParameters');
    },
    createUser(variables: CreateUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateUserQuery>(CreateUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createUser');
    },
    deleteUser(variables: DeleteUserQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteUserQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteUserQuery>(DeleteUserDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteUser');
    },
    deleteUserMetaParameter(variables: DeleteUserMetaParameterQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteUserMetaParameterQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteUserMetaParameterQuery>(DeleteUserMetaParameterDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteUserMetaParameter');
    },
    getPermissionsList(variables?: GetPermissionsListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetPermissionsListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetPermissionsListQuery>(GetPermissionsListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getPermissionsList');
    },
    getUserGrantedConnections(variables?: GetUserGrantedConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserGrantedConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserGrantedConnectionsQuery>(GetUserGrantedConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserGrantedConnections');
    },
    getUsersList(variables: GetUsersListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUsersListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUsersListQuery>(GetUsersListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUsersList');
    },
    grantUserRole(variables: GrantUserRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GrantUserRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GrantUserRoleQuery>(GrantUserRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'grantUserRole');
    },
    revokeUserRole(variables: RevokeUserRoleQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RevokeUserRoleQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<RevokeUserRoleQuery>(RevokeUserRoleDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'revokeUserRole');
    },
    setConnections(variables: SetConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionsQuery>(SetConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnections');
    },
    setUserCredentials(variables: SetUserCredentialsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetUserCredentialsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetUserCredentialsQuery>(SetUserCredentialsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setUserCredentials');
    },
    setUserMetaParameter(variables: SetUserMetaParameterQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetUserMetaParameterQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetUserMetaParameterQuery>(SetUserMetaParameterDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setUserMetaParameter');
    },
    updateUserProfileProperties(variables: UpdateUserProfilePropertiesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateUserProfilePropertiesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateUserProfilePropertiesQuery>(UpdateUserProfilePropertiesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateUserProfileProperties');
    },
    createConnectionConfiguration(variables: CreateConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionConfigurationQuery>(CreateConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionConfiguration');
    },
    createConnectionConfigurationFromNode(variables: CreateConnectionConfigurationFromNodeQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionConfigurationFromNodeQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionConfigurationFromNodeQuery>(CreateConnectionConfigurationFromNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionConfigurationFromNode');
    },
    deleteConnectionConfiguration(variables: DeleteConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteConnectionConfigurationQuery>(DeleteConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteConnectionConfiguration');
    },
    getConnectionAccess(variables?: GetConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetConnectionAccessQuery>(GetConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getConnectionAccess');
    },
    getConnections(variables: GetConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetConnectionsQuery>(GetConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getConnections');
    },
    getSubjectConnectionAccess(variables?: GetSubjectConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSubjectConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSubjectConnectionAccessQuery>(GetSubjectConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSubjectConnectionAccess');
    },
    searchDatabases(variables: SearchDatabasesQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SearchDatabasesQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SearchDatabasesQuery>(SearchDatabasesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'searchDatabases');
    },
    setConnectionAccess(variables: SetConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionAccessQuery>(SetConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnectionAccess');
    },
    setSubjectConnectionAccess(variables: SetSubjectConnectionAccessQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetSubjectConnectionAccessQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetSubjectConnectionAccessQuery>(SetSubjectConnectionAccessDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setSubjectConnectionAccess');
    },
    updateConnectionConfiguration(variables: UpdateConnectionConfigurationQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateConnectionConfigurationQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateConnectionConfigurationQuery>(UpdateConnectionConfigurationDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateConnectionConfiguration');
    },
    closeConnection(variables: CloseConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CloseConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CloseConnectionMutation>(CloseConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'closeConnection');
    },
    createConnection(variables: CreateConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionMutation>(CreateConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnection');
    },
    createConnectionFromNode(variables: CreateConnectionFromNodeMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionFromNodeMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionFromNodeMutation>(CreateConnectionFromNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionFromNode');
    },
    createConnectionFromTemplate(variables: CreateConnectionFromTemplateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CreateConnectionFromTemplateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CreateConnectionFromTemplateMutation>(CreateConnectionFromTemplateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'createConnectionFromTemplate');
    },
    deleteConnection(variables: DeleteConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DeleteConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<DeleteConnectionMutation>(DeleteConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'deleteConnection');
    },
    driverList(variables: DriverListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<DriverListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<DriverListQuery>(DriverListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'driverList');
    },
    executionContextCreate(variables: ExecutionContextCreateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextCreateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextCreateMutation>(ExecutionContextCreateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextCreate');
    },
    executionContextDestroy(variables: ExecutionContextDestroyMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextDestroyMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextDestroyMutation>(ExecutionContextDestroyDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextDestroy');
    },
    executionContextList(variables?: ExecutionContextListQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextListQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextListQuery>(ExecutionContextListDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextList');
    },
    executionContextUpdate(variables: ExecutionContextUpdateMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExecutionContextUpdateMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ExecutionContextUpdateMutation>(ExecutionContextUpdateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'executionContextUpdate');
    },
    getAuthModels(variables?: GetAuthModelsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAuthModelsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAuthModelsQuery>(GetAuthModelsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAuthModels');
    },
    getTemplateConnections(variables: GetTemplateConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetTemplateConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetTemplateConnectionsQuery>(GetTemplateConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getTemplateConnections');
    },
    getUserConnections(variables: GetUserConnectionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetUserConnectionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetUserConnectionsQuery>(GetUserConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getUserConnections');
    },
    initConnection(variables: InitConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<InitConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<InitConnectionMutation>(InitConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'initConnection');
    },
    refreshSessionConnections(variables?: RefreshSessionConnectionsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RefreshSessionConnectionsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<RefreshSessionConnectionsMutation>(RefreshSessionConnectionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'refreshSessionConnections');
    },
    setConnectionNavigatorSettings(variables: SetConnectionNavigatorSettingsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetConnectionNavigatorSettingsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<SetConnectionNavigatorSettingsMutation>(SetConnectionNavigatorSettingsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setConnectionNavigatorSettings');
    },
    testConnection(variables: TestConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TestConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TestConnectionMutation>(TestConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'testConnection');
    },
    testNetworkHandler(variables: TestNetworkHandlerMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TestNetworkHandlerMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TestNetworkHandlerMutation>(TestNetworkHandlerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'testNetworkHandler');
    },
    updateConnection(variables: UpdateConnectionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateConnectionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateConnectionMutation>(UpdateConnectionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateConnection');
    },
    exportDataFromContainer(variables: ExportDataFromContainerQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExportDataFromContainerQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExportDataFromContainerQuery>(ExportDataFromContainerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'exportDataFromContainer');
    },
    exportDataFromResults(variables: ExportDataFromResultsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ExportDataFromResultsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ExportDataFromResultsQuery>(ExportDataFromResultsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'exportDataFromResults');
    },
    getDataTransferProcessors(variables?: GetDataTransferProcessorsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetDataTransferProcessorsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetDataTransferProcessorsQuery>(GetDataTransferProcessorsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getDataTransferProcessors');
    },
    removeDataTransferFile(variables: RemoveDataTransferFileQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<RemoveDataTransferFileQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<RemoveDataTransferFileQuery>(RemoveDataTransferFileDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'removeDataTransferFile');
    },
    navGetStructContainers(variables: NavGetStructContainersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavGetStructContainersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavGetStructContainersQuery>(NavGetStructContainersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navGetStructContainers');
    },
    formatSqlQuery(variables: FormatSqlQueryQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<FormatSqlQueryQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<FormatSqlQueryQuery>(FormatSqlQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'formatSqlQuery');
    },
    getAsyncTaskInfo(variables: GetAsyncTaskInfoMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetAsyncTaskInfoMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetAsyncTaskInfoMutation>(GetAsyncTaskInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getAsyncTaskInfo');
    },
    getNetworkHandlers(variables?: GetNetworkHandlersQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetNetworkHandlersQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetNetworkHandlersQuery>(GetNetworkHandlersDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getNetworkHandlers');
    },
    asyncReadDataFromContainer(variables: AsyncReadDataFromContainerMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncReadDataFromContainerMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncReadDataFromContainerMutation>(AsyncReadDataFromContainerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncReadDataFromContainer');
    },
    asyncSqlExecuteQuery(variables: AsyncSqlExecuteQueryMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncSqlExecuteQueryMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncSqlExecuteQueryMutation>(AsyncSqlExecuteQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncSqlExecuteQuery');
    },
    asyncSqlExplainExecutionPlan(variables: AsyncSqlExplainExecutionPlanMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<AsyncSqlExplainExecutionPlanMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<AsyncSqlExplainExecutionPlanMutation>(AsyncSqlExplainExecutionPlanDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'asyncSqlExplainExecutionPlan');
    },
    closeResult(variables: CloseResultMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<CloseResultMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<CloseResultMutation>(CloseResultDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'closeResult');
    },
    getSqlExecuteTaskResults(variables: GetSqlExecuteTaskResultsMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSqlExecuteTaskResultsMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSqlExecuteTaskResultsMutation>(GetSqlExecuteTaskResultsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSqlExecuteTaskResults');
    },
    getSqlExecutionPlanResult(variables: GetSqlExecutionPlanResultMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetSqlExecutionPlanResultMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<GetSqlExecutionPlanResultMutation>(GetSqlExecutionPlanResultDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getSqlExecutionPlanResult');
    },
    updateResultsDataBatch(variables: UpdateResultsDataBatchMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateResultsDataBatchMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateResultsDataBatchMutation>(UpdateResultsDataBatchDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateResultsDataBatch');
    },
    updateResultsDataBatchScript(variables: UpdateResultsDataBatchScriptMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<UpdateResultsDataBatchScriptMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<UpdateResultsDataBatchScriptMutation>(UpdateResultsDataBatchScriptDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'updateResultsDataBatchScript');
    },
    metadataGetNodeDDL(variables: MetadataGetNodeDdlQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<MetadataGetNodeDdlQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<MetadataGetNodeDdlQuery>(MetadataGetNodeDdlDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'metadataGetNodeDDL');
    },
    getChildrenDBObjectInfo(variables: GetChildrenDbObjectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetChildrenDbObjectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetChildrenDbObjectInfoQuery>(GetChildrenDbObjectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getChildrenDBObjectInfo');
    },
    getDBObjectInfo(variables: GetDbObjectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<GetDbObjectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<GetDbObjectInfoQuery>(GetDbObjectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'getDBObjectInfo');
    },
    navDeleteNodes(variables: NavDeleteNodesMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavDeleteNodesMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<NavDeleteNodesMutation>(NavDeleteNodesDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navDeleteNodes');
    },
    navNodeChildren(variables: NavNodeChildrenQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavNodeChildrenQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavNodeChildrenQuery>(NavNodeChildrenDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navNodeChildren');
    },
    navNodeInfo(variables: NavNodeInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavNodeInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavNodeInfoQuery>(NavNodeInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navNodeInfo');
    },
    navRefreshNode(variables: NavRefreshNodeQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavRefreshNodeQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<NavRefreshNodeQuery>(NavRefreshNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navRefreshNode');
    },
    navRenameNode(variables: NavRenameNodeMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<NavRenameNodeMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<NavRenameNodeMutation>(NavRenameNodeDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'navRenameNode');
    },
    querySqlCompletionProposals(variables: QuerySqlCompletionProposalsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<QuerySqlCompletionProposalsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<QuerySqlCompletionProposalsQuery>(QuerySqlCompletionProposalsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'querySqlCompletionProposals');
    },
    querySqlDialectInfo(variables: QuerySqlDialectInfoQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<QuerySqlDialectInfoQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<QuerySqlDialectInfoQuery>(QuerySqlDialectInfoDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'querySqlDialectInfo');
    },
    configureServer(variables: ConfigureServerQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ConfigureServerQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ConfigureServerQuery>(ConfigureServerDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'configureServer');
    },
    listFeatureSets(variables?: ListFeatureSetsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ListFeatureSetsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ListFeatureSetsQuery>(ListFeatureSetsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'listFeatureSets');
    },
    setDefaultNavigatorSettings(variables: SetDefaultNavigatorSettingsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SetDefaultNavigatorSettingsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SetDefaultNavigatorSettingsQuery>(SetDefaultNavigatorSettingsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'setDefaultNavigatorSettings');
    },
    changeSessionLanguage(variables: ChangeSessionLanguageMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ChangeSessionLanguageMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<ChangeSessionLanguageMutation>(ChangeSessionLanguageDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'changeSessionLanguage');
    },
    openSession(variables?: OpenSessionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<OpenSessionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<OpenSessionMutation>(OpenSessionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'openSession');
    },
    readSessionLog(variables: ReadSessionLogQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ReadSessionLogQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ReadSessionLogQuery>(ReadSessionLogDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'readSessionLog');
    },
    serverConfig(variables?: ServerConfigQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<ServerConfigQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<ServerConfigQuery>(ServerConfigDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'serverConfig');
    },
    sessionPermissions(variables?: SessionPermissionsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SessionPermissionsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SessionPermissionsQuery>(SessionPermissionsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sessionPermissions');
    },
    sessionState(variables?: SessionStateQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SessionStateQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SessionStateQuery>(SessionStateDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sessionState');
    },
    touchSession(variables?: TouchSessionMutationVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<TouchSessionMutation> {
      return withWrapper(wrappedRequestHeaders => client.request<TouchSessionMutation>(TouchSessionDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'touchSession');
    },
    sqlEntityQueryGenerators(variables: SqlEntityQueryGeneratorsQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SqlEntityQueryGeneratorsQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SqlEntityQueryGeneratorsQuery>(SqlEntityQueryGeneratorsDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sqlEntityQueryGenerators');
    },
    sqlGenerateEntityQuery(variables: SqlGenerateEntityQueryQueryVariables, requestHeaders?: Dom.RequestInit['headers']): Promise<SqlGenerateEntityQueryQuery> {
      return withWrapper(wrappedRequestHeaders => client.request<SqlGenerateEntityQueryQuery>(SqlGenerateEntityQueryDocument, variables, { ...requestHeaders, ...wrappedRequestHeaders }), 'sqlGenerateEntityQuery');
    },
  };
}
export type Sdk = ReturnType<typeof getSdk>;
