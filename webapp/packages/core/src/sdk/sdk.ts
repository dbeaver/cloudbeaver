/* eslint-disable */
import { GraphQLClient } from "graphql-request";
import { print } from "graphql";
import gql from "graphql-tag";
export type Maybe<T> = T;

/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  /** Any object (JSON) */
  Object: any;
  /** Date/Time */
  DateTime: any;
};

export type AsyncTaskInfo = {
  id: Scalars["String"];
  name?: Maybe<Scalars["String"]>;
  running: Scalars["Boolean"];
  status?: Maybe<Scalars["String"]>;
  error?: Maybe<ServerError>;
  result?: Maybe<SqlExecuteInfo>;
  /**
   * Task result.
   * Can be some kind of identifier to obtain real result using another API function
   */
  taskResult?: Maybe<Scalars["Object"]>;
};

export enum AuthCredentialEncryption {
  None = "none",
  Plain = "plain",
  Hash = "hash",
}

export type AuthCredentialInfo = {
  id: Scalars["ID"];
  displayName: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  editable?: Maybe<Scalars["Boolean"]>;
  identifying?: Maybe<Scalars["Boolean"]>;
  /** This field must be shown in admin panel */
  admin?: Maybe<Scalars["Boolean"]>;
  /** This field must be shown in login form */
  user?: Maybe<Scalars["Boolean"]>;
  possibleValues?: Maybe<Array<Maybe<Scalars["String"]>>>;
  encryption?: Maybe<AuthCredentialEncryption>;
};

export type AuthProviderInfo = {
  id: Scalars["ID"];
  label: Scalars["String"];
  icon?: Maybe<Scalars["ID"]>;
  description?: Maybe<Scalars["String"]>;
  isDefault?: Maybe<Scalars["Boolean"]>;
  configurationParameters: Array<Maybe<ObjectPropertyInfo>>;
  credentialParameters: Array<Maybe<AuthCredentialInfo>>;
};

/** Configuration of particular connection. Used for new connection create. Includes auth info */
export type ConnectionConfig = {
  name?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  /** ID of predefined datasource */
  dataSourceId?: Maybe<Scalars["ID"]>;
  /** Driver ID */
  driverId?: Maybe<Scalars["ID"]>;
  /** Host */
  host?: Maybe<Scalars["String"]>;
  /** Port */
  port?: Maybe<Scalars["String"]>;
  /** Databae name */
  databaseName?: Maybe<Scalars["String"]>;
  /** Databae name */
  url?: Maybe<Scalars["String"]>;
  /** Properties */
  properties?: Maybe<Scalars["Object"]>;
  userName?: Maybe<Scalars["String"]>;
  userPassword?: Maybe<Scalars["String"]>;
};

/** Connection instance */
export type ConnectionInfo = {
  id: Scalars["ID"];
  driverId: Scalars["ID"];
  name: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  properties?: Maybe<Scalars["String"]>;
  connected: Scalars["Boolean"];
  provided: Scalars["Boolean"];
  connectTime?: Maybe<Scalars["String"]>;
  connectionError?: Maybe<ServerError>;
  serverVersion?: Maybe<Scalars["String"]>;
  clientVersion?: Maybe<Scalars["String"]>;
  /** Supported features (provided etc) */
  features?: Maybe<Array<Scalars["String"]>>;
};

export type DatabaseObjectInfo = {
  /** Object name */
  name?: Maybe<Scalars["String"]>;
  /** Description - optional */
  description?: Maybe<Scalars["String"]>;
  /** Object type. Java class name in most cases */
  type?: Maybe<Scalars["String"]>;
  /**
   * Read object properties.
   * Optional parameter 'ids' filters properties by id. null means all properties.
   * Note: property value reading may take a lot of time so don't read all property values always
   * Examine property meta (features in particular) before reading them
   */
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  ordinalPosition?: Maybe<Scalars["Int"]>;
  fullyQualifiedName?: Maybe<Scalars["String"]>;
  overloadedName?: Maybe<Scalars["String"]>;
  uniqueName?: Maybe<Scalars["String"]>;
  state?: Maybe<Scalars["String"]>;
  /** Features: script, scriptExtended, dataContainer, dataManipulator, entity, schema, catalog */
  features?: Maybe<Array<Maybe<Scalars["String"]>>>;
  /** Supported editors: ddl, permissions, sourceDeclaration, sourceDefinition */
  editors?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

export type DatabaseObjectInfoPropertiesArgs = {
  filter?: Maybe<ObjectPropertyFilter>;
};

export type DatabaseStructContainers = {
  catalogList: Array<DatabaseObjectInfo>;
  schemaList: Array<DatabaseObjectInfo>;
};

/** Data source info is a description of some remote database. Doesn't include user credentials */
export type DataSourceInfo = {
  id: Scalars["ID"];
  driverId: Scalars["ID"];
  name: Scalars["String"];
  description?: Maybe<Scalars["String"]>;
  host?: Maybe<Scalars["String"]>;
  server?: Maybe<Scalars["String"]>;
  port?: Maybe<Scalars["String"]>;
  url?: Maybe<Scalars["String"]>;
  properties?: Maybe<Scalars["String"]>;
};

export type DataTransferParameters = {
  /** Processor ID */
  processorId: Scalars["ID"];
  /**
   * General settings:
   *   - openNewConnection: opens new database connection for data transfer task
   */
  settings?: Maybe<Scalars["Object"]>;
  /** Processor properties. See DataTransferProcessorInfo.properties */
  processorProperties: Scalars["Object"];
  /** Data filter settings */
  filter?: Maybe<SqlDataFilter>;
};

export type DataTransferProcessorInfo = {
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  fileExtension?: Maybe<Scalars["String"]>;
  appFileExtension?: Maybe<Scalars["String"]>;
  appName?: Maybe<Scalars["String"]>;
  order: Scalars["Int"];
  icon?: Maybe<Scalars["String"]>;
  properties?: Maybe<Array<Maybe<ObjectPropertyInfo>>>;
  isBinary?: Maybe<Scalars["Boolean"]>;
  isHTML?: Maybe<Scalars["Boolean"]>;
};

export type DriverInfo = {
  id: Scalars["ID"];
  name?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  icon?: Maybe<Scalars["String"]>;
  iconBig?: Maybe<Scalars["String"]>;
  /** Driver provider ID */
  providerId?: Maybe<Scalars["ID"]>;
  /** Driver Java class name */
  driverClassName?: Maybe<Scalars["String"]>;
  defaultPort?: Maybe<Scalars["String"]>;
  sampleURL?: Maybe<Scalars["String"]>;
  driverInfoURL?: Maybe<Scalars["String"]>;
  driverPropertiesURL?: Maybe<Scalars["String"]>;
  embedded?: Maybe<Scalars["Boolean"]>;
  anonymousAccess?: Maybe<Scalars["Boolean"]>;
  allowsEmptyPassword?: Maybe<Scalars["Boolean"]>;
  licenseRequired?: Maybe<Scalars["Boolean"]>;
  license?: Maybe<Scalars["String"]>;
  custom?: Maybe<Scalars["Boolean"]>;
  /** Driver score for ordering, biggest first */
  promotedScore?: Maybe<Scalars["Int"]>;
  connectionProperties?: Maybe<Scalars["Object"]>;
  defaultConnectionProperties?: Maybe<Scalars["Object"]>;
  /**
   * Driver properties.
   * Note: it is expensive property and it may produce database server roundtrips.
   * Call it only when you really need it.
   */
  driverProperties?: Maybe<Array<Maybe<DriverPropertyInfo>>>;
  driverParameters?: Maybe<Scalars["Object"]>;
};

export type DriverPropertyInfo = {
  id: Scalars["ID"];
  displayName?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  category?: Maybe<Scalars["String"]>;
  dataType?: Maybe<Scalars["String"]>;
  defaultValue?: Maybe<Scalars["Object"]>;
  validValues?: Maybe<Array<Maybe<Scalars["Object"]>>>;
};

export type LogEntry = {
  time?: Maybe<Scalars["DateTime"]>;
  type: Scalars["String"];
  message?: Maybe<Scalars["String"]>;
  stackTrace?: Maybe<Scalars["String"]>;
};

export type Mutation = {
  /** Initialize session */
  openSession?: Maybe<SessionInfo>;
  /** Destroy session */
  closeSession?: Maybe<Scalars["Boolean"]>;
  /** Refreshes session on server and returns its state */
  touchSession?: Maybe<Scalars["Boolean"]>;
  /** Refreshes session on server and returns its state */
  changeSessionLanguage?: Maybe<Scalars["Boolean"]>;
  /** Create new connection */
  createConnection?: Maybe<ConnectionInfo>;
  /** Test connection configuration. Returns remote server version */
  testConnection?: Maybe<ConnectionInfo>;
  /** Connect to database */
  openConnection?: Maybe<ConnectionInfo>;
  /** Disconnect from database */
  closeConnection: Scalars["Boolean"];
  asyncTaskCancel?: Maybe<Scalars["Boolean"]>;
  asyncTaskStatus: AsyncTaskInfo;
  sqlContextCreate: SqlContextInfo;
  sqlContextSetDefaults: Scalars["Boolean"];
  sqlContextDestroy: Scalars["Boolean"];
  sqlExecuteQuery?: Maybe<SqlExecuteInfo>;
  sqlResultClose: Scalars["Boolean"];
  readDataFromContainer?: Maybe<SqlExecuteInfo>;
  updateResultsData?: Maybe<SqlExecuteInfo>;
  /** Returns SQLExecuteInfo */
  asyncSqlExecuteQuery: AsyncTaskInfo;
};

export type MutationChangeSessionLanguageArgs = {
  locale?: Maybe<Scalars["String"]>;
};

export type MutationCreateConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationTestConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationOpenConnectionArgs = {
  config: ConnectionConfig;
};

export type MutationCloseConnectionArgs = {
  id: Scalars["ID"];
};

export type MutationAsyncTaskCancelArgs = {
  id: Scalars["String"];
};

export type MutationAsyncTaskStatusArgs = {
  id: Scalars["String"];
};

export type MutationSqlContextCreateArgs = {
  connectionId: Scalars["ID"];
  defaultCatalog?: Maybe<Scalars["String"]>;
  defaultSchema?: Maybe<Scalars["String"]>;
};

export type MutationSqlContextSetDefaultsArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  defaultCatalog?: Maybe<Scalars["ID"]>;
  defaultSchema?: Maybe<Scalars["ID"]>;
};

export type MutationSqlContextDestroyArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
};

export type MutationSqlExecuteQueryArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  sql: Scalars["String"];
  filter?: Maybe<SqlDataFilter>;
};

export type MutationSqlResultCloseArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultId: Scalars["ID"];
};

export type MutationReadDataFromContainerArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  containerNodePath: Scalars["ID"];
  filter?: Maybe<SqlDataFilter>;
};

export type MutationUpdateResultsDataArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultsId: Scalars["ID"];
  updateRow: Array<Maybe<Scalars["Object"]>>;
  updateValues?: Maybe<Scalars["Object"]>;
};

export type MutationAsyncSqlExecuteQueryArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  sql: Scalars["String"];
  filter?: Maybe<SqlDataFilter>;
};

export type NavigatorNodeInfo = {
  /** Node ID - generally a full path to the node from root of tree */
  id: Scalars["ID"];
  /** Node human readable name */
  name?: Maybe<Scalars["String"]>;
  /** Node icon path */
  icon?: Maybe<Scalars["String"]>;
  /** Node description */
  description?: Maybe<Scalars["String"]>;
  /** Node type */
  nodeType?: Maybe<Scalars["String"]>;
  /** Can this property have child nodes? */
  hasChildren?: Maybe<Scalars["Boolean"]>;
  /** Associated object. Maybe null for non-database objects */
  object?: Maybe<DatabaseObjectInfo>;
  /** Supported features: item, container, leaf */
  features?: Maybe<Array<Maybe<Scalars["String"]>>>;
  folder?: Maybe<Scalars["Boolean"]>;
  inline?: Maybe<Scalars["Boolean"]>;
  navigable?: Maybe<Scalars["Boolean"]>;
};

export type ObjectDescriptor = {
  id?: Maybe<Scalars["Int"]>;
  displayName?: Maybe<Scalars["String"]>;
  fullName?: Maybe<Scalars["String"]>;
  uniqueName?: Maybe<Scalars["String"]>;
  description?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["String"]>;
};

export type ObjectPropertyFilter = {
  ids?: Maybe<Array<Maybe<Scalars["String"]>>>;
  features?: Maybe<Array<Maybe<Scalars["String"]>>>;
  categories?: Maybe<Array<Maybe<Scalars["String"]>>>;
  dataTypes?: Maybe<Array<Maybe<Scalars["String"]>>>;
};

export type ObjectPropertyInfo = {
  /** ID */
  id?: Maybe<Scalars["String"]>;
  /** Human readable name */
  displayName?: Maybe<Scalars["String"]>;
  /** Property description */
  description?: Maybe<Scalars["String"]>;
  /** Property category (may be used if object has a lot of properties) */
  category?: Maybe<Scalars["String"]>;
  /** Property data type (int, String, etc) */
  dataType?: Maybe<Scalars["String"]>;
  /** Property value. Note: for some properties value reading may take a lot of time (e.g. RowCount for tables) */
  value?: Maybe<Scalars["Object"]>;
  /** List of values this property can take. Makes sense only for enumerable properties */
  validValues?: Maybe<Array<Maybe<Scalars["Object"]>>>;
  /** Default property value */
  defaultValue?: Maybe<Scalars["Object"]>;
  /** Supported features (system, hidden, inherited, foreign, expensive, etc) */
  features?: Maybe<Array<Scalars["String"]>>;
};

export type Query = {
  /** Returns server config */
  serverConfig?: Maybe<ServerConfig>;
  /** Returns session state ( initialize if not ) */
  sessionState?: Maybe<SessionInfo>;
  /** Session permissions */
  sessionPermissions: Array<Maybe<Scalars["ID"]>>;
  /** Get driver info */
  driverList?: Maybe<Array<DriverInfo>>;
  /** Get list of predefined data sources */
  dataSourceList?: Maybe<Array<DataSourceInfo>>;
  /** Return connection state */
  connectionState?: Maybe<ConnectionInfo>;
  readSessionLog?: Maybe<Array<LogEntry>>;
  /** Get child nodes */
  navNodeChildren?: Maybe<Array<NavigatorNodeInfo>>;
  navNodeInfo?: Maybe<NavigatorNodeInfo>;
  navRefreshNode?: Maybe<Scalars["Boolean"]>;
  navGetStructContainers: DatabaseStructContainers;
  sqlDialectInfo?: Maybe<SqlDialectInfo>;
  sqlListContexts?: Maybe<Array<Maybe<SqlContextInfo>>>;
  sqlCompletionProposals?: Maybe<Array<Maybe<SqlCompletionProposal>>>;
  authLogin?: Maybe<UserAuthInfo>;
  authLogout?: Maybe<Scalars["Boolean"]>;
  sessionUser?: Maybe<UserAuthInfo>;
  authProviders: Array<Maybe<AuthProviderInfo>>;
  /** Available transfer processors */
  dataTransferAvailableStreamProcessors?: Maybe<
    Array<Maybe<DataTransferProcessorInfo>>
  >;
  dataTransferExportDataFromContainer: AsyncTaskInfo;
  dataTransferExportDataFromResults: AsyncTaskInfo;
  dataTransferRemoveDataFile?: Maybe<Scalars["Boolean"]>;
  /** Get child nodes */
  metadataGetNodeDDL?: Maybe<Scalars["String"]>;
};

export type QueryDriverListArgs = {
  id?: Maybe<Scalars["ID"]>;
};

export type QueryConnectionStateArgs = {
  id: Scalars["ID"];
};

export type QueryReadSessionLogArgs = {
  maxEntries?: Maybe<Scalars["Int"]>;
  clearEntries?: Maybe<Scalars["Boolean"]>;
};

export type QueryNavNodeChildrenArgs = {
  parentPath: Scalars["ID"];
  offset?: Maybe<Scalars["Int"]>;
  limit?: Maybe<Scalars["Int"]>;
  onlyFolders?: Maybe<Scalars["Boolean"]>;
};

export type QueryNavNodeInfoArgs = {
  nodePath: Scalars["ID"];
};

export type QueryNavRefreshNodeArgs = {
  nodePath: Scalars["ID"];
};

export type QueryNavGetStructContainersArgs = {
  connectionId: Scalars["ID"];
  catalog?: Maybe<Scalars["ID"]>;
};

export type QuerySqlDialectInfoArgs = {
  connectionId: Scalars["ID"];
};

export type QuerySqlListContextsArgs = {
  connectionId: Scalars["ID"];
};

export type QuerySqlCompletionProposalsArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  query: Scalars["String"];
  position: Scalars["Int"];
  maxResults?: Maybe<Scalars["Int"]>;
};

export type QueryAuthLoginArgs = {
  provider: Scalars["ID"];
  credentials: Scalars["Object"];
};

export type QueryDataTransferExportDataFromContainerArgs = {
  connectionId: Scalars["ID"];
  containerNodePath: Scalars["ID"];
  parameters: DataTransferParameters;
};

export type QueryDataTransferExportDataFromResultsArgs = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultsId: Scalars["ID"];
  parameters: DataTransferParameters;
};

export type QueryDataTransferRemoveDataFileArgs = {
  dataFileId: Scalars["String"];
};

export type QueryMetadataGetNodeDdlArgs = {
  nodeId: Scalars["ID"];
  options?: Maybe<Scalars["Object"]>;
};

export type ServerConfig = {
  name: Scalars["String"];
  version: Scalars["String"];
  anonymousAccessEnabled?: Maybe<Scalars["Boolean"]>;
  authenticationEnabled?: Maybe<Scalars["Boolean"]>;
  supportsPredefinedConnections?: Maybe<Scalars["Boolean"]>;
  supportsProvidedConnections?: Maybe<Scalars["Boolean"]>;
  supportsCustomConnections?: Maybe<Scalars["Boolean"]>;
  supportsConnectionBrowser?: Maybe<Scalars["Boolean"]>;
  supportsWorkspaces?: Maybe<Scalars["Boolean"]>;
  supportedLanguages: Array<Maybe<ServerLanguage>>;
  services?: Maybe<Array<Maybe<WebServiceConfig>>>;
  productConfiguration: Scalars["Object"];
};

export type ServerError = {
  message?: Maybe<Scalars["String"]>;
  errorCode?: Maybe<Scalars["String"]>;
  stackTrace?: Maybe<Scalars["String"]>;
  causedBy?: Maybe<ServerError>;
};

export type ServerLanguage = {
  isoCode: Scalars["String"];
  displayName?: Maybe<Scalars["String"]>;
  nativeName?: Maybe<Scalars["String"]>;
};

export type ServerMessage = {
  time?: Maybe<Scalars["String"]>;
  message?: Maybe<Scalars["String"]>;
};

export type SessionInfo = {
  createTime: Scalars["String"];
  lastAccessTime: Scalars["String"];
  locale: Scalars["String"];
  cacheExpired: Scalars["Boolean"];
  serverMessages?: Maybe<Array<Maybe<ServerMessage>>>;
  connections: Array<Maybe<ConnectionInfo>>;
};

export type SqlCompletionProposal = {
  displayString?: Maybe<Scalars["String"]>;
  type?: Maybe<Scalars["String"]>;
  score?: Maybe<Scalars["Int"]>;
  replacementString?: Maybe<Scalars["String"]>;
  replacementOffset?: Maybe<Scalars["Int"]>;
  replacementLength?: Maybe<Scalars["Int"]>;
  cursorPosition?: Maybe<Scalars["Int"]>;
  icon?: Maybe<Scalars["String"]>;
  nodePath?: Maybe<Scalars["String"]>;
};

/** SQL context must be created for each SQL editor */
export type SqlContextInfo = {
  id: Scalars["ID"];
  defaultCatalog?: Maybe<Scalars["String"]>;
  defaultSchema?: Maybe<Scalars["String"]>;
};

export type SqlDataFilter = {
  offset?: Maybe<Scalars["Int"]>;
  limit?: Maybe<Scalars["Int"]>;
  constraints?: Maybe<Array<Maybe<SqlDataFilterConstraint>>>;
  where?: Maybe<Scalars["String"]>;
};

export type SqlDataFilterConstraint = {
  attribute: Scalars["String"];
  orderPosition?: Maybe<Scalars["Int"]>;
  orderAsc?: Maybe<Scalars["Boolean"]>;
  criteria?: Maybe<Scalars["String"]>;
  operator?: Maybe<Scalars["String"]>;
  value?: Maybe<Scalars["Object"]>;
};

export type SqlDialectInfo = {
  name?: Maybe<Scalars["String"]>;
  dataTypes?: Maybe<Array<Maybe<Scalars["String"]>>>;
  functions?: Maybe<Array<Maybe<Scalars["String"]>>>;
  reservedWords?: Maybe<Array<Maybe<Scalars["String"]>>>;
  quoteStrings?: Maybe<Array<Maybe<Array<Maybe<Scalars["String"]>>>>>;
  singleLineComments?: Maybe<Array<Maybe<Scalars["String"]>>>;
  multiLineComments?: Maybe<Array<Maybe<Array<Maybe<Scalars["String"]>>>>>;
  catalogSeparator?: Maybe<Scalars["String"]>;
  structSeparator?: Maybe<Scalars["String"]>;
  scriptDelimiter?: Maybe<Scalars["String"]>;
};

export type SqlExecuteInfo = {
  statusMessage?: Maybe<Scalars["String"]>;
  duration?: Maybe<Scalars["Int"]>;
  results?: Maybe<Array<SqlQueryResults>>;
};

export type SqlQueryResults = {
  title?: Maybe<Scalars["String"]>;
  updateRowCount?: Maybe<Scalars["Int"]>;
  sourceQuery?: Maybe<Scalars["String"]>;
  resultSet?: Maybe<SqlResultSet>;
};

export type SqlResultColumn = {
  position?: Maybe<Scalars["Int"]>;
  name?: Maybe<Scalars["String"]>;
  label?: Maybe<Scalars["String"]>;
  icon?: Maybe<Scalars["String"]>;
  entityName?: Maybe<Scalars["String"]>;
  dataKind?: Maybe<Scalars["String"]>;
  typeName?: Maybe<Scalars["String"]>;
  fullTypeName?: Maybe<Scalars["String"]>;
  maxLength?: Maybe<Scalars["Int"]>;
  scale?: Maybe<Scalars["Int"]>;
  precision?: Maybe<Scalars["Int"]>;
};

export type SqlResultSet = {
  id: Scalars["ID"];
  columns?: Maybe<Array<Maybe<SqlResultColumn>>>;
  rows?: Maybe<Array<Maybe<Array<Maybe<Scalars["Object"]>>>>>;
  /** server always returns hasMoreData = false */
  hasMoreData?: Maybe<Scalars["Boolean"]>;
};

export type UserAuthInfo = {
  /** User unique identifier */
  userId: Scalars["String"];
  /** Human readable display name. May be null */
  displayName?: Maybe<Scalars["String"]>;
  /** Auth provider ID */
  authProvider: Scalars["String"];
  loginTime: Scalars["DateTime"];
  /** Optional login message */
  message?: Maybe<Scalars["String"]>;
};

export type WebServiceConfig = {
  id: Scalars["String"];
  name: Scalars["String"];
  description: Scalars["String"];
  bundleVersion: Scalars["String"];
};

export type NavGetStructContainersQueryVariables = {
  connectionId: Scalars["ID"];
  catalogId?: Maybe<Scalars["ID"]>;
};

export type NavGetStructContainersQuery = {
  navGetStructContainers: {
    catalogList: Array<
      Pick<DatabaseObjectInfo, "name" | "description" | "type" | "features">
    >;
    schemaList: Array<
      Pick<DatabaseObjectInfo, "name" | "description" | "type" | "features">
    >;
  };
};

export type CloseConnectionMutationVariables = {
  id: Scalars["ID"];
};

export type CloseConnectionMutation = Pick<Mutation, "closeConnection">;

export type ConnectionStateQueryVariables = {
  id: Scalars["ID"];
};

export type ConnectionStateQuery = {
  connection: Maybe<
    Pick<ConnectionInfo, "id" | "name" | "driverId" | "connected">
  >;
};

export type CreateConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type CreateConnectionMutation = {
  createConnection: Maybe<
    Pick<ConnectionInfo, "id" | "name" | "driverId" | "connected">
  >;
};

export type DataSourceListQueryVariables = {};

export type DataSourceListQuery = {
  dataSourceList: Maybe<
    Array<Pick<DataSourceInfo, "id" | "name" | "driverId" | "description">>
  >;
};

export type DriverListQueryVariables = {};

export type DriverListQuery = {
  driverList: Maybe<
    Array<
      Pick<
        DriverInfo,
        | "id"
        | "name"
        | "icon"
        | "description"
        | "defaultPort"
        | "sampleURL"
        | "embedded"
        | "anonymousAccess"
        | "promotedScore"
      >
    >
  >;
};

export type DriverPropertiesQueryVariables = {
  driverId: Scalars["ID"];
};

export type DriverPropertiesQuery = {
  driver: Maybe<
    Array<
      Pick<DriverInfo, "driverParameters"> & {
        driverProperties: Maybe<
          Array<
            Maybe<
              Pick<
                DriverPropertyInfo,
                | "id"
                | "displayName"
                | "description"
                | "category"
                | "dataType"
                | "defaultValue"
                | "validValues"
              >
            >
          >
        >;
      }
    >
  >;
};

export type GetDriverByIdQueryVariables = {
  driverId: Scalars["ID"];
};

export type GetDriverByIdQuery = {
  driverList: Maybe<Array<Pick<DriverInfo, "id" | "name" | "icon">>>;
};

export type OpenConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type OpenConnectionMutation = {
  openConnection: Maybe<
    Pick<ConnectionInfo, "id" | "name" | "driverId" | "connected">
  >;
};

export type TestConnectionMutationVariables = {
  config: ConnectionConfig;
};

export type TestConnectionMutation = {
  testConnection: Maybe<Pick<ConnectionInfo, "id">>;
};

export type NavNodeChildrenQueryVariables = {
  parentPath: Scalars["ID"];
};

export type NavNodeChildrenQuery = {
  navNodeChildren: Maybe<
    Array<
      Pick<
        NavigatorNodeInfo,
        | "id"
        | "name"
        | "hasChildren"
        | "nodeType"
        | "icon"
        | "folder"
        | "inline"
        | "navigable"
        | "features"
      > & { object: Maybe<Pick<DatabaseObjectInfo, "features">> }
    >
  >;
};

export type NavNodeInfoQueryVariables = {
  nodePath: Scalars["ID"];
};

export type NavNodeInfoQuery = {
  navNodeInfo: Maybe<
    Pick<
      NavigatorNodeInfo,
      | "id"
      | "name"
      | "hasChildren"
      | "nodeType"
      | "icon"
      | "folder"
      | "inline"
      | "navigable"
      | "features"
    > & { object: Maybe<Pick<DatabaseObjectInfo, "features">> }
  >;
};

export type QueryChildrenDatabaseObjectInfoQueryVariables = {
  nodePath: Scalars["ID"];
  filter?: Maybe<ObjectPropertyFilter>;
};

export type QueryChildrenDatabaseObjectInfoQuery = {
  childrenDatabaseObjectInfo: Maybe<
    Array<
      Pick<NavigatorNodeInfo, "id"> & {
        object: Maybe<
          Pick<DatabaseObjectInfo, "features"> & {
            properties: Maybe<
              Array<
                Maybe<
                  Pick<
                    ObjectPropertyInfo,
                    | "id"
                    | "category"
                    | "dataType"
                    | "description"
                    | "displayName"
                    | "features"
                    | "value"
                  >
                >
              >
            >;
          }
        >;
      }
    >
  >;
};

export type QueryDatabaseObjectInfoQueryVariables = {
  nodeId: Scalars["ID"];
  filter?: Maybe<ObjectPropertyFilter>;
};

export type QueryDatabaseObjectInfoQuery = {
  objectInfo: Maybe<
    Pick<NavigatorNodeInfo, "id"> & {
      object: Maybe<
        Pick<DatabaseObjectInfo, "features"> & {
          properties: Maybe<
            Array<
              Maybe<
                Pick<
                  ObjectPropertyInfo,
                  | "id"
                  | "category"
                  | "dataType"
                  | "description"
                  | "displayName"
                  | "features"
                  | "value"
                >
              >
            >
          >;
        }
      >;
    }
  >;
};

export type ReadSessionLogQueryVariables = {
  maxEntries: Scalars["Int"];
  clearEntries: Scalars["Boolean"];
};

export type ReadSessionLogQuery = {
  log: Maybe<Array<Pick<LogEntry, "time" | "type" | "message" | "stackTrace">>>;
};

export type ChangeSessionLanguageMutationVariables = {
  locale: Scalars["String"];
};

export type ChangeSessionLanguageMutation = Pick<
  Mutation,
  "changeSessionLanguage"
>;

export type AuthLoginQueryVariables = {
  provider: Scalars["ID"];
  credentials: Scalars["Object"];
};

export type AuthLoginQuery = {
  user: Maybe<
    Pick<
      UserAuthInfo,
      "userId" | "displayName" | "authProvider" | "loginTime" | "message"
    >
  >;
};

export type AuthLogoutQueryVariables = {};

export type AuthLogoutQuery = Pick<Query, "authLogout">;

export type GetAuthProvidersQueryVariables = {};

export type GetAuthProvidersQuery = {
  providers: Array<
    Maybe<
      Pick<
        AuthProviderInfo,
        "id" | "label" | "icon" | "description" | "isDefault"
      > & {
        credentialParameters: Array<
          Maybe<
            Pick<
              AuthCredentialInfo,
              | "id"
              | "displayName"
              | "description"
              | "editable"
              | "identifying"
              | "admin"
              | "user"
              | "possibleValues"
              | "encryption"
            >
          >
        >;
      }
    >
  >;
};

export type GetSessionUserQueryVariables = {};

export type GetSessionUserQuery = {
  user: Maybe<
    Pick<
      UserAuthInfo,
      "userId" | "displayName" | "authProvider" | "loginTime" | "message"
    >
  >;
};

export type AsyncExportTaskStatusMutationVariables = {
  taskId: Scalars["String"];
};

export type AsyncExportTaskStatusMutation = {
  taskInfo: Pick<
    AsyncTaskInfo,
    "id" | "name" | "running" | "status" | "taskResult"
  > & {
    error: Maybe<Pick<ServerError, "message" | "errorCode" | "stackTrace">>;
  };
};

export type ExportDataFromContainerQueryVariables = {
  connectionId: Scalars["ID"];
  containerNodePath: Scalars["ID"];
  parameters: DataTransferParameters;
};

export type ExportDataFromContainerQuery = {
  taskInfo: Pick<AsyncTaskInfo, "id" | "running" | "taskResult"> & {
    error: Maybe<Pick<ServerError, "message" | "errorCode" | "stackTrace">>;
  };
};

export type ExportDataFromResultsQueryVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultsId: Scalars["ID"];
  parameters: DataTransferParameters;
};

export type ExportDataFromResultsQuery = {
  taskInfo: Pick<AsyncTaskInfo, "id" | "running" | "taskResult"> & {
    error: Maybe<Pick<ServerError, "message" | "errorCode" | "stackTrace">>;
  };
};

export type GetDataTransferProcessorsQueryVariables = {};

export type GetDataTransferProcessorsQuery = {
  processors: Maybe<
    Array<
      Maybe<
        Pick<
          DataTransferProcessorInfo,
          | "id"
          | "name"
          | "description"
          | "fileExtension"
          | "appFileExtension"
          | "appName"
          | "order"
          | "icon"
          | "isBinary"
          | "isHTML"
        > & {
          properties: Maybe<
            Array<
              Maybe<
                Pick<
                  ObjectPropertyInfo,
                  | "id"
                  | "displayName"
                  | "description"
                  | "category"
                  | "dataType"
                  | "defaultValue"
                  | "validValues"
                  | "features"
                >
              >
            >
          >;
        }
      >
    >
  >;
};

export type RemoveDataTransferFileQueryVariables = {
  dataFileId: Scalars["String"];
};

export type RemoveDataTransferFileQuery = {
  result: Query["dataTransferRemoveDataFile"];
};

export type AsyncSqlExecuteQueryMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  query: Scalars["String"];
  filter?: Maybe<SqlDataFilter>;
};

export type AsyncSqlExecuteQueryMutation = {
  taskInfo: Pick<AsyncTaskInfo, "id" | "running"> & {
    result: Maybe<
      Pick<SqlExecuteInfo, "duration" | "statusMessage"> & {
        results: Maybe<
          Array<
            Pick<
              SqlQueryResults,
              "updateRowCount" | "sourceQuery" | "title"
            > & {
              resultSet: Maybe<
                Pick<SqlResultSet, "id" | "rows"> & {
                  columns: Maybe<
                    Array<
                      Maybe<
                        Pick<
                          SqlResultColumn,
                          | "dataKind"
                          | "entityName"
                          | "fullTypeName"
                          | "icon"
                          | "label"
                          | "maxLength"
                          | "name"
                          | "position"
                          | "precision"
                          | "scale"
                          | "typeName"
                        >
                      >
                    >
                  >;
                }
              >;
            }
          >
        >;
      }
    >;
    error: Maybe<Pick<ServerError, "message" | "errorCode" | "stackTrace">>;
  };
};

export type AsyncTaskCancelMutationVariables = {
  taskId: Scalars["String"];
};

export type AsyncTaskCancelMutation = { result: Mutation["asyncTaskCancel"] };

export type AsyncTaskStatusMutationVariables = {
  taskId: Scalars["String"];
};

export type AsyncTaskStatusMutation = {
  taskInfo: Pick<AsyncTaskInfo, "id" | "running"> & {
    result: Maybe<
      Pick<SqlExecuteInfo, "duration" | "statusMessage"> & {
        results: Maybe<
          Array<
            Pick<
              SqlQueryResults,
              "updateRowCount" | "sourceQuery" | "title"
            > & {
              resultSet: Maybe<
                Pick<SqlResultSet, "id" | "rows"> & {
                  columns: Maybe<
                    Array<
                      Maybe<
                        Pick<
                          SqlResultColumn,
                          | "dataKind"
                          | "entityName"
                          | "fullTypeName"
                          | "icon"
                          | "label"
                          | "maxLength"
                          | "name"
                          | "position"
                          | "precision"
                          | "scale"
                          | "typeName"
                        >
                      >
                    >
                  >;
                }
              >;
            }
          >
        >;
      }
    >;
    error: Maybe<Pick<ServerError, "message" | "errorCode" | "stackTrace">>;
  };
};

export type ExecuteSqlQueryMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  query: Scalars["String"];
  filter?: Maybe<SqlDataFilter>;
};

export type ExecuteSqlQueryMutation = {
  result: Maybe<
    Pick<SqlExecuteInfo, "duration" | "statusMessage"> & {
      results: Maybe<
        Array<
          Pick<SqlQueryResults, "updateRowCount" | "sourceQuery" | "title"> & {
            resultSet: Maybe<
              Pick<SqlResultSet, "id" | "rows"> & {
                columns: Maybe<
                  Array<
                    Maybe<
                      Pick<
                        SqlResultColumn,
                        | "dataKind"
                        | "entityName"
                        | "fullTypeName"
                        | "icon"
                        | "label"
                        | "maxLength"
                        | "name"
                        | "position"
                        | "precision"
                        | "scale"
                        | "typeName"
                      >
                    >
                  >
                >;
              }
            >;
          }
        >
      >;
    }
  >;
};

export type MetadataGetNodeDdlQueryVariables = {
  nodeId: Scalars["ID"];
};

export type MetadataGetNodeDdlQuery = Pick<Query, "metadataGetNodeDDL">;

export type QuerySqlCompletionProposalsQueryVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  position: Scalars["Int"];
  query: Scalars["String"];
  maxResults?: Maybe<Scalars["Int"]>;
};

export type QuerySqlCompletionProposalsQuery = {
  sqlCompletionProposals: Maybe<
    Array<
      Maybe<
        Pick<
          SqlCompletionProposal,
          | "cursorPosition"
          | "displayString"
          | "icon"
          | "nodePath"
          | "replacementLength"
          | "replacementOffset"
          | "replacementString"
          | "score"
          | "type"
        >
      >
    >
  >;
};

export type QuerySqlDialectInfoQueryVariables = {
  connectionId: Scalars["ID"];
};

export type QuerySqlDialectInfoQuery = {
  dialect: Maybe<
    Pick<
      SqlDialectInfo,
      | "name"
      | "dataTypes"
      | "functions"
      | "reservedWords"
      | "quoteStrings"
      | "singleLineComments"
      | "multiLineComments"
      | "catalogSeparator"
      | "structSeparator"
      | "scriptDelimiter"
    >
  >;
};

export type ReadDataFromContainerMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  containerNodePath: Scalars["ID"];
  filter?: Maybe<SqlDataFilter>;
};

export type ReadDataFromContainerMutation = {
  readDataFromContainer: Maybe<
    Pick<SqlExecuteInfo, "duration" | "statusMessage"> & {
      results: Maybe<
        Array<
          Pick<SqlQueryResults, "updateRowCount" | "sourceQuery" | "title"> & {
            resultSet: Maybe<
              Pick<SqlResultSet, "id" | "rows"> & {
                columns: Maybe<
                  Array<
                    Maybe<
                      Pick<
                        SqlResultColumn,
                        | "dataKind"
                        | "entityName"
                        | "fullTypeName"
                        | "icon"
                        | "label"
                        | "maxLength"
                        | "name"
                        | "position"
                        | "precision"
                        | "scale"
                        | "typeName"
                      >
                    >
                  >
                >;
              }
            >;
          }
        >
      >;
    }
  >;
};

export type SqlContextCreateMutationVariables = {
  connectionId: Scalars["ID"];
  defaultCatalog?: Maybe<Scalars["String"]>;
  defaultSchema?: Maybe<Scalars["String"]>;
};

export type SqlContextCreateMutation = {
  context: Pick<SqlContextInfo, "id" | "defaultCatalog" | "defaultSchema">;
};

export type SqlContextDestroyMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
};

export type SqlContextDestroyMutation = Pick<Mutation, "sqlContextDestroy">;

export type SqlContextSetDefaultsMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  defaultCatalog?: Maybe<Scalars["ID"]>;
  defaultSchema?: Maybe<Scalars["ID"]>;
};

export type SqlContextSetDefaultsMutation = {
  context: Mutation["sqlContextSetDefaults"];
};

export type SqlResultCloseMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultId: Scalars["ID"];
};

export type SqlResultCloseMutation = { result: Mutation["sqlResultClose"] };

export type UpdateResultsDataMutationVariables = {
  connectionId: Scalars["ID"];
  contextId: Scalars["ID"];
  resultsId: Scalars["ID"];
  sourceRowValues: Array<Maybe<Scalars["Object"]>>;
  values?: Maybe<Scalars["Object"]>;
};

export type UpdateResultsDataMutation = {
  result: Maybe<
    Pick<SqlExecuteInfo, "duration"> & {
      results: Maybe<
        Array<
          Pick<SqlQueryResults, "updateRowCount"> & {
            resultSet: Maybe<Pick<SqlResultSet, "id" | "rows">>;
          }
        >
      >;
    }
  >;
};

export type OpenSessionMutationVariables = {};

export type OpenSessionMutation = {
  session: Maybe<
    Pick<
      SessionInfo,
      "createTime" | "lastAccessTime" | "cacheExpired" | "locale"
    > & {
      connections: Array<
        Maybe<Pick<ConnectionInfo, "id" | "name" | "driverId" | "connected">>
      >;
    }
  >;
};

export type ServerConfigQueryVariables = {};

export type ServerConfigQuery = {
  serverConfig: Maybe<
    Pick<
      ServerConfig,
      | "name"
      | "version"
      | "productConfiguration"
      | "supportsPredefinedConnections"
      | "supportsProvidedConnections"
      | "supportsCustomConnections"
      | "supportsConnectionBrowser"
      | "supportsWorkspaces"
      | "anonymousAccessEnabled"
      | "authenticationEnabled"
    > & {
      supportedLanguages: Array<
        Maybe<Pick<ServerLanguage, "isoCode" | "displayName" | "nativeName">>
      >;
    }
  >;
};

export type SessionPermissionsQueryVariables = {};

export type SessionPermissionsQuery = {
  permissions: Query["sessionPermissions"];
};

export type SessionStateQueryVariables = {};

export type SessionStateQuery = {
  sessionState: Maybe<
    Pick<
      SessionInfo,
      "createTime" | "lastAccessTime" | "locale" | "cacheExpired"
    > & {
      connections: Array<
        Maybe<Pick<ConnectionInfo, "id" | "name" | "driverId" | "connected">>
      >;
    }
  >;
};

export type TouchSessionMutationVariables = {};

export type TouchSessionMutation = Pick<Mutation, "touchSession">;

export const NavGetStructContainersDocument = gql`
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
export const CloseConnectionDocument = gql`
  mutation closeConnection($id: ID!) {
    closeConnection(id: $id)
  }
`;
export const ConnectionStateDocument = gql`
  query connectionState($id: ID!) {
    connection: connectionState(id: $id) {
      id
      name
      driverId
      connected
    }
  }
`;
export const CreateConnectionDocument = gql`
  mutation createConnection($config: ConnectionConfig!) {
    createConnection(config: $config) {
      id
      name
      driverId
      connected
    }
  }
`;
export const DataSourceListDocument = gql`
  query dataSourceList {
    dataSourceList {
      id
      name
      driverId
      description
    }
  }
`;
export const DriverListDocument = gql`
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
export const DriverPropertiesDocument = gql`
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
export const GetDriverByIdDocument = gql`
  query getDriverById($driverId: ID!) {
    driverList(id: $driverId) {
      id
      name
      icon
    }
  }
`;
export const OpenConnectionDocument = gql`
  mutation openConnection($config: ConnectionConfig!) {
    openConnection(config: $config) {
      id
      name
      driverId
      connected
    }
  }
`;
export const TestConnectionDocument = gql`
  mutation testConnection($config: ConnectionConfig!) {
    testConnection(config: $config) {
      id
    }
  }
`;
export const NavNodeChildrenDocument = gql`
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
  }
`;
export const NavNodeInfoDocument = gql`
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
export const QueryChildrenDatabaseObjectInfoDocument = gql`
  query queryChildrenDatabaseObjectInfo(
    $nodePath: ID!
    $filter: ObjectPropertyFilter
  ) {
    childrenDatabaseObjectInfo: navNodeChildren(parentPath: $nodePath) {
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
export const QueryDatabaseObjectInfoDocument = gql`
  query queryDatabaseObjectInfo($nodeId: ID!, $filter: ObjectPropertyFilter) {
    objectInfo: navNodeInfo(nodePath: $nodeId) {
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
export const ReadSessionLogDocument = gql`
  query readSessionLog($maxEntries: Int!, $clearEntries: Boolean!) {
    log: readSessionLog(maxEntries: $maxEntries, clearEntries: $clearEntries) {
      time
      type
      message
      stackTrace
    }
  }
`;
export const ChangeSessionLanguageDocument = gql`
  mutation changeSessionLanguage($locale: String!) {
    changeSessionLanguage(locale: $locale)
  }
`;
export const AuthLoginDocument = gql`
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
export const AuthLogoutDocument = gql`
  query authLogout {
    authLogout
  }
`;
export const GetAuthProvidersDocument = gql`
  query getAuthProviders {
    providers: authProviders {
      id
      label
      icon
      description
      isDefault
      credentialParameters {
        id
        displayName
        description
        editable
        identifying
        admin
        user
        possibleValues
        encryption
      }
    }
  }
`;
export const GetSessionUserDocument = gql`
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
export const AsyncExportTaskStatusDocument = gql`
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
export const ExportDataFromContainerDocument = gql`
  query exportDataFromContainer(
    $connectionId: ID!
    $containerNodePath: ID!
    $parameters: DataTransferParameters!
  ) {
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
export const ExportDataFromResultsDocument = gql`
  query exportDataFromResults(
    $connectionId: ID!
    $contextId: ID!
    $resultsId: ID!
    $parameters: DataTransferParameters!
  ) {
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
export const GetDataTransferProcessorsDocument = gql`
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
export const RemoveDataTransferFileDocument = gql`
  query removeDataTransferFile($dataFileId: String!) {
    result: dataTransferRemoveDataFile(dataFileId: $dataFileId)
  }
`;
export const AsyncSqlExecuteQueryDocument = gql`
  mutation asyncSqlExecuteQuery(
    $connectionId: ID!
    $contextId: ID!
    $query: String!
    $filter: SQLDataFilter
  ) {
    taskInfo: asyncSqlExecuteQuery(
      connectionId: $connectionId
      contextId: $contextId
      sql: $query
      filter: $filter
    ) {
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
export const AsyncTaskCancelDocument = gql`
  mutation asyncTaskCancel($taskId: String!) {
    result: asyncTaskCancel(id: $taskId)
  }
`;
export const AsyncTaskStatusDocument = gql`
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
export const ExecuteSqlQueryDocument = gql`
  mutation executeSqlQuery(
    $connectionId: ID!
    $contextId: ID!
    $query: String!
    $filter: SQLDataFilter
  ) {
    result: sqlExecuteQuery(
      connectionId: $connectionId
      contextId: $contextId
      sql: $query
      filter: $filter
    ) {
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
export const MetadataGetNodeDdlDocument = gql`
  query metadataGetNodeDDL($nodeId: ID!) {
    metadataGetNodeDDL(nodeId: $nodeId)
  }
`;
export const QuerySqlCompletionProposalsDocument = gql`
  query querySqlCompletionProposals(
    $connectionId: ID!
    $contextId: ID!
    $position: Int!
    $query: String!
    $maxResults: Int
  ) {
    sqlCompletionProposals(
      connectionId: $connectionId
      contextId: $contextId
      maxResults: $maxResults
      position: $position
      query: $query
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
export const QuerySqlDialectInfoDocument = gql`
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
export const ReadDataFromContainerDocument = gql`
  mutation readDataFromContainer(
    $connectionId: ID!
    $contextId: ID!
    $containerNodePath: ID!
    $filter: SQLDataFilter
  ) {
    readDataFromContainer(
      connectionId: $connectionId
      contextId: $contextId
      containerNodePath: $containerNodePath
      filter: $filter
    ) {
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
export const SqlContextCreateDocument = gql`
  mutation sqlContextCreate(
    $connectionId: ID!
    $defaultCatalog: String
    $defaultSchema: String
  ) {
    context: sqlContextCreate(
      connectionId: $connectionId
      defaultCatalog: $defaultCatalog
      defaultSchema: $defaultSchema
    ) {
      id
      defaultCatalog
      defaultSchema
    }
  }
`;
export const SqlContextDestroyDocument = gql`
  mutation sqlContextDestroy($connectionId: ID!, $contextId: ID!) {
    sqlContextDestroy(connectionId: $connectionId, contextId: $contextId)
  }
`;
export const SqlContextSetDefaultsDocument = gql`
  mutation sqlContextSetDefaults(
    $connectionId: ID!
    $contextId: ID!
    $defaultCatalog: ID
    $defaultSchema: ID
  ) {
    context: sqlContextSetDefaults(
      connectionId: $connectionId
      contextId: $contextId
      defaultCatalog: $defaultCatalog
      defaultSchema: $defaultSchema
    )
  }
`;
export const SqlResultCloseDocument = gql`
  mutation sqlResultClose($connectionId: ID!, $contextId: ID!, $resultId: ID!) {
    result: sqlResultClose(
      connectionId: $connectionId
      contextId: $contextId
      resultId: $resultId
    )
  }
`;
export const UpdateResultsDataDocument = gql`
  mutation updateResultsData(
    $connectionId: ID!
    $contextId: ID!
    $resultsId: ID!
    $sourceRowValues: [Object]!
    $values: Object
  ) {
    result: updateResultsData(
      connectionId: $connectionId
      contextId: $contextId
      resultsId: $resultsId
      updateRow: $sourceRowValues
      updateValues: $values
    ) {
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
export const OpenSessionDocument = gql`
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
      }
    }
  }
`;
export const ServerConfigDocument = gql`
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
export const SessionPermissionsDocument = gql`
  query sessionPermissions {
    permissions: sessionPermissions
  }
`;
export const SessionStateDocument = gql`
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
      }
    }
  }
`;
export const TouchSessionDocument = gql`
  mutation touchSession {
    touchSession
  }
`;
export function getSdk(client: GraphQLClient) {
  return {
    navGetStructContainers(
      variables: NavGetStructContainersQueryVariables,
    ): Promise<NavGetStructContainersQuery> {
      return client.request<NavGetStructContainersQuery>(
        print(NavGetStructContainersDocument),
        variables,
      );
    },
    closeConnection(
      variables: CloseConnectionMutationVariables,
    ): Promise<CloseConnectionMutation> {
      return client.request<CloseConnectionMutation>(
        print(CloseConnectionDocument),
        variables,
      );
    },
    connectionState(
      variables: ConnectionStateQueryVariables,
    ): Promise<ConnectionStateQuery> {
      return client.request<ConnectionStateQuery>(
        print(ConnectionStateDocument),
        variables,
      );
    },
    createConnection(
      variables: CreateConnectionMutationVariables,
    ): Promise<CreateConnectionMutation> {
      return client.request<CreateConnectionMutation>(
        print(CreateConnectionDocument),
        variables,
      );
    },
    dataSourceList(
      variables?: DataSourceListQueryVariables,
    ): Promise<DataSourceListQuery> {
      return client.request<DataSourceListQuery>(
        print(DataSourceListDocument),
        variables,
      );
    },
    driverList(variables?: DriverListQueryVariables): Promise<DriverListQuery> {
      return client.request<DriverListQuery>(
        print(DriverListDocument),
        variables,
      );
    },
    driverProperties(
      variables: DriverPropertiesQueryVariables,
    ): Promise<DriverPropertiesQuery> {
      return client.request<DriverPropertiesQuery>(
        print(DriverPropertiesDocument),
        variables,
      );
    },
    getDriverById(
      variables: GetDriverByIdQueryVariables,
    ): Promise<GetDriverByIdQuery> {
      return client.request<GetDriverByIdQuery>(
        print(GetDriverByIdDocument),
        variables,
      );
    },
    openConnection(
      variables: OpenConnectionMutationVariables,
    ): Promise<OpenConnectionMutation> {
      return client.request<OpenConnectionMutation>(
        print(OpenConnectionDocument),
        variables,
      );
    },
    testConnection(
      variables: TestConnectionMutationVariables,
    ): Promise<TestConnectionMutation> {
      return client.request<TestConnectionMutation>(
        print(TestConnectionDocument),
        variables,
      );
    },
    navNodeChildren(
      variables: NavNodeChildrenQueryVariables,
    ): Promise<NavNodeChildrenQuery> {
      return client.request<NavNodeChildrenQuery>(
        print(NavNodeChildrenDocument),
        variables,
      );
    },
    navNodeInfo(
      variables: NavNodeInfoQueryVariables,
    ): Promise<NavNodeInfoQuery> {
      return client.request<NavNodeInfoQuery>(
        print(NavNodeInfoDocument),
        variables,
      );
    },
    queryChildrenDatabaseObjectInfo(
      variables: QueryChildrenDatabaseObjectInfoQueryVariables,
    ): Promise<QueryChildrenDatabaseObjectInfoQuery> {
      return client.request<QueryChildrenDatabaseObjectInfoQuery>(
        print(QueryChildrenDatabaseObjectInfoDocument),
        variables,
      );
    },
    queryDatabaseObjectInfo(
      variables: QueryDatabaseObjectInfoQueryVariables,
    ): Promise<QueryDatabaseObjectInfoQuery> {
      return client.request<QueryDatabaseObjectInfoQuery>(
        print(QueryDatabaseObjectInfoDocument),
        variables,
      );
    },
    readSessionLog(
      variables: ReadSessionLogQueryVariables,
    ): Promise<ReadSessionLogQuery> {
      return client.request<ReadSessionLogQuery>(
        print(ReadSessionLogDocument),
        variables,
      );
    },
    changeSessionLanguage(
      variables: ChangeSessionLanguageMutationVariables,
    ): Promise<ChangeSessionLanguageMutation> {
      return client.request<ChangeSessionLanguageMutation>(
        print(ChangeSessionLanguageDocument),
        variables,
      );
    },
    authLogin(variables: AuthLoginQueryVariables): Promise<AuthLoginQuery> {
      return client.request<AuthLoginQuery>(
        print(AuthLoginDocument),
        variables,
      );
    },
    authLogout(variables?: AuthLogoutQueryVariables): Promise<AuthLogoutQuery> {
      return client.request<AuthLogoutQuery>(
        print(AuthLogoutDocument),
        variables,
      );
    },
    getAuthProviders(
      variables?: GetAuthProvidersQueryVariables,
    ): Promise<GetAuthProvidersQuery> {
      return client.request<GetAuthProvidersQuery>(
        print(GetAuthProvidersDocument),
        variables,
      );
    },
    getSessionUser(
      variables?: GetSessionUserQueryVariables,
    ): Promise<GetSessionUserQuery> {
      return client.request<GetSessionUserQuery>(
        print(GetSessionUserDocument),
        variables,
      );
    },
    asyncExportTaskStatus(
      variables: AsyncExportTaskStatusMutationVariables,
    ): Promise<AsyncExportTaskStatusMutation> {
      return client.request<AsyncExportTaskStatusMutation>(
        print(AsyncExportTaskStatusDocument),
        variables,
      );
    },
    exportDataFromContainer(
      variables: ExportDataFromContainerQueryVariables,
    ): Promise<ExportDataFromContainerQuery> {
      return client.request<ExportDataFromContainerQuery>(
        print(ExportDataFromContainerDocument),
        variables,
      );
    },
    exportDataFromResults(
      variables: ExportDataFromResultsQueryVariables,
    ): Promise<ExportDataFromResultsQuery> {
      return client.request<ExportDataFromResultsQuery>(
        print(ExportDataFromResultsDocument),
        variables,
      );
    },
    getDataTransferProcessors(
      variables?: GetDataTransferProcessorsQueryVariables,
    ): Promise<GetDataTransferProcessorsQuery> {
      return client.request<GetDataTransferProcessorsQuery>(
        print(GetDataTransferProcessorsDocument),
        variables,
      );
    },
    removeDataTransferFile(
      variables: RemoveDataTransferFileQueryVariables,
    ): Promise<RemoveDataTransferFileQuery> {
      return client.request<RemoveDataTransferFileQuery>(
        print(RemoveDataTransferFileDocument),
        variables,
      );
    },
    asyncSqlExecuteQuery(
      variables: AsyncSqlExecuteQueryMutationVariables,
    ): Promise<AsyncSqlExecuteQueryMutation> {
      return client.request<AsyncSqlExecuteQueryMutation>(
        print(AsyncSqlExecuteQueryDocument),
        variables,
      );
    },
    asyncTaskCancel(
      variables: AsyncTaskCancelMutationVariables,
    ): Promise<AsyncTaskCancelMutation> {
      return client.request<AsyncTaskCancelMutation>(
        print(AsyncTaskCancelDocument),
        variables,
      );
    },
    asyncTaskStatus(
      variables: AsyncTaskStatusMutationVariables,
    ): Promise<AsyncTaskStatusMutation> {
      return client.request<AsyncTaskStatusMutation>(
        print(AsyncTaskStatusDocument),
        variables,
      );
    },
    executeSqlQuery(
      variables: ExecuteSqlQueryMutationVariables,
    ): Promise<ExecuteSqlQueryMutation> {
      return client.request<ExecuteSqlQueryMutation>(
        print(ExecuteSqlQueryDocument),
        variables,
      );
    },
    metadataGetNodeDDL(
      variables: MetadataGetNodeDdlQueryVariables,
    ): Promise<MetadataGetNodeDdlQuery> {
      return client.request<MetadataGetNodeDdlQuery>(
        print(MetadataGetNodeDdlDocument),
        variables,
      );
    },
    querySqlCompletionProposals(
      variables: QuerySqlCompletionProposalsQueryVariables,
    ): Promise<QuerySqlCompletionProposalsQuery> {
      return client.request<QuerySqlCompletionProposalsQuery>(
        print(QuerySqlCompletionProposalsDocument),
        variables,
      );
    },
    querySqlDialectInfo(
      variables: QuerySqlDialectInfoQueryVariables,
    ): Promise<QuerySqlDialectInfoQuery> {
      return client.request<QuerySqlDialectInfoQuery>(
        print(QuerySqlDialectInfoDocument),
        variables,
      );
    },
    readDataFromContainer(
      variables: ReadDataFromContainerMutationVariables,
    ): Promise<ReadDataFromContainerMutation> {
      return client.request<ReadDataFromContainerMutation>(
        print(ReadDataFromContainerDocument),
        variables,
      );
    },
    sqlContextCreate(
      variables: SqlContextCreateMutationVariables,
    ): Promise<SqlContextCreateMutation> {
      return client.request<SqlContextCreateMutation>(
        print(SqlContextCreateDocument),
        variables,
      );
    },
    sqlContextDestroy(
      variables: SqlContextDestroyMutationVariables,
    ): Promise<SqlContextDestroyMutation> {
      return client.request<SqlContextDestroyMutation>(
        print(SqlContextDestroyDocument),
        variables,
      );
    },
    sqlContextSetDefaults(
      variables: SqlContextSetDefaultsMutationVariables,
    ): Promise<SqlContextSetDefaultsMutation> {
      return client.request<SqlContextSetDefaultsMutation>(
        print(SqlContextSetDefaultsDocument),
        variables,
      );
    },
    sqlResultClose(
      variables: SqlResultCloseMutationVariables,
    ): Promise<SqlResultCloseMutation> {
      return client.request<SqlResultCloseMutation>(
        print(SqlResultCloseDocument),
        variables,
      );
    },
    updateResultsData(
      variables: UpdateResultsDataMutationVariables,
    ): Promise<UpdateResultsDataMutation> {
      return client.request<UpdateResultsDataMutation>(
        print(UpdateResultsDataDocument),
        variables,
      );
    },
    openSession(
      variables?: OpenSessionMutationVariables,
    ): Promise<OpenSessionMutation> {
      return client.request<OpenSessionMutation>(
        print(OpenSessionDocument),
        variables,
      );
    },
    serverConfig(
      variables?: ServerConfigQueryVariables,
    ): Promise<ServerConfigQuery> {
      return client.request<ServerConfigQuery>(
        print(ServerConfigDocument),
        variables,
      );
    },
    sessionPermissions(
      variables?: SessionPermissionsQueryVariables,
    ): Promise<SessionPermissionsQuery> {
      return client.request<SessionPermissionsQuery>(
        print(SessionPermissionsDocument),
        variables,
      );
    },
    sessionState(
      variables?: SessionStateQueryVariables,
    ): Promise<SessionStateQuery> {
      return client.request<SessionStateQuery>(
        print(SessionStateDocument),
        variables,
      );
    },
    touchSession(
      variables?: TouchSessionMutationVariables,
    ): Promise<TouchSessionMutation> {
      return client.request<TouchSessionMutation>(
        print(TouchSessionDocument),
        variables,
      );
    },
  };
}
