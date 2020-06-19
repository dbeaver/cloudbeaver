import { App, PluginManifest } from '@cloudbeaver/core-di';

import { AppBootstrap } from './AppBootstrap';
import { showErrorPage } from './ErrorPage';
import { renderLayout } from './renderLayout';

export async function bootstrap(plugins: PluginManifest[]) {

  const app = new App(plugins);
  app.registerServices();

  const appBootstrap = app.getServiceInjector().resolveServiceByClass(AppBootstrap);

  try {
    await appBootstrap.init();
    await app.initializeServices();
    await app.initializePlugins();
    await appBootstrap.doAfterPluginsInit();
    await app.load();

    renderLayout(app.getServiceInjector());
  } catch (e) {
    console.log(e);
    showErrorPage();
  }
}
