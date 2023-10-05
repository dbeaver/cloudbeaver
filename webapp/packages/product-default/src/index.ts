import 'reflect-metadata';

import { bootstrap } from '@cloudbeaver/core-bootstrap';
import type { PluginManifest } from '@cloudbeaver/core-di';
import administration from '@cloudbeaver/plugin-administration';
import authentication from '@cloudbeaver/plugin-authentication';
import authenticationAdministration from '@cloudbeaver/plugin-authentication-administration';
import { browserPlugin } from '@cloudbeaver/plugin-browser';
import connectionCustom from '@cloudbeaver/plugin-connection-custom';
import connectionSearch from '@cloudbeaver/plugin-connection-search';
import connectionTemplate from '@cloudbeaver/plugin-connection-template';
import connectionPlugin from '@cloudbeaver/plugin-connections';
import connectionAdministration from '@cloudbeaver/plugin-connections-administration';
import { dataExportManifest } from '@cloudbeaver/plugin-data-export';
import { dataSpreadsheetNewManifest } from '@cloudbeaver/plugin-data-spreadsheet-new';
import { dataViewerManifest } from '@cloudbeaver/plugin-data-viewer';
import { dvResultSetGroupingPlugin } from '@cloudbeaver/plugin-data-viewer-result-set-grouping';
import { datasourceContextSwitchPluginManifest } from '@cloudbeaver/plugin-datasource-context-switch';
import ddlViewer from '@cloudbeaver/plugin-ddl-viewer';
import devTools from '@cloudbeaver/plugin-devtools';
import gisViewer from '@cloudbeaver/plugin-gis-viewer';
import help from '@cloudbeaver/plugin-help';
import localization from '@cloudbeaver/plugin-localization';
import logViewer from '@cloudbeaver/plugin-log-viewer';
import { navigationTabsPlugin } from '@cloudbeaver/plugin-navigation-tabs';
import { navigationTreePlugin } from '@cloudbeaver/plugin-navigation-tree';
import navigationTreeFilters from '@cloudbeaver/plugin-navigation-tree-filters';
import { navigationTreeRMPlugin } from '@cloudbeaver/plugin-navigation-tree-rm';
import { objectViewerManifest } from '@cloudbeaver/plugin-object-viewer';
import productPlugin from '@cloudbeaver/plugin-product';
import projects from '@cloudbeaver/plugin-projects';
import resourceManager from '@cloudbeaver/plugin-resource-manager';
import resourceManagerAdministration from '@cloudbeaver/plugin-resource-manager-administration';
import resourceManagerScripts from '@cloudbeaver/plugin-resource-manager-scripts';
import root from '@cloudbeaver/plugin-root';
import { sessionExpirationPlugin } from '@cloudbeaver/plugin-session-expiration';
import settingsMenu from '@cloudbeaver/plugin-settings-menu';
import settingsMenuAdministration from '@cloudbeaver/plugin-settings-menu-administration';
import settingsPanelPlugin from '@cloudbeaver/plugin-settings-panel';
import sqlEditor from '@cloudbeaver/plugin-sql-editor';
import sqlEditorTab from '@cloudbeaver/plugin-sql-editor-navigation-tab';
import sqlEditorResource from '@cloudbeaver/plugin-sql-editor-navigation-tab-script';
import sqlEditorNew from '@cloudbeaver/plugin-sql-editor-new';
import sqlEditorScreen from '@cloudbeaver/plugin-sql-editor-screen';
import { sqlGeneratorPlugin } from '@cloudbeaver/plugin-sql-generator';
import { ssoPlugin } from '@cloudbeaver/plugin-sso';
import theme from '@cloudbeaver/plugin-theme';
import toolsPanel from '@cloudbeaver/plugin-tools-panel';
import topAppBar from '@cloudbeaver/plugin-top-app-bar';
import { administrationTopAppBarPlugin } from '@cloudbeaver/plugin-top-app-bar-administration';
import userProfile from '@cloudbeaver/plugin-user-profile';
import userProfileAdministration from '@cloudbeaver/plugin-user-profile-administration';
import version from '@cloudbeaver/plugin-version';
import versionUpdate from '@cloudbeaver/plugin-version-update-administration';

import { defaultProductManifest } from './manifest';

const PLUGINS: PluginManifest[] = [
  ssoPlugin,
  devTools,
  administration,
  dataSpreadsheetNewManifest,
  authentication,
  authenticationAdministration,
  theme,
  localization,
  connectionCustom,
  connectionTemplate,
  connectionSearch,
  dataExportManifest,
  dataViewerManifest,
  dvResultSetGroupingPlugin,
  gisViewer,
  ddlViewer,
  objectViewerManifest,
  sqlEditor,
  sqlEditorTab,
  sqlEditorScreen,
  sqlEditorNew,
  sqlGeneratorPlugin,
  userProfile,
  userProfileAdministration,
  defaultProductManifest,
  connectionPlugin,
  connectionAdministration,
  versionUpdate,
  productPlugin,
  settingsMenu,
  settingsMenuAdministration,
  settingsPanelPlugin,
  help,
  resourceManager,
  resourceManagerAdministration,
  resourceManagerScripts,
  sqlEditorResource,
  logViewer,
  navigationTreePlugin,
  navigationTreeRMPlugin,
  datasourceContextSwitchPluginManifest,
  topAppBar,
  administrationTopAppBarPlugin,
  version,
  navigationTabsPlugin,
  root,
  sessionExpirationPlugin,
  toolsPanel,
  projects,
  browserPlugin,
  navigationTreeFilters,
];

bootstrap(PLUGINS);
