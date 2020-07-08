import { App, PluginManifest } from '@cloudbeaver/core-di';

import { AppBootstrap } from './AppBootstrap';
import { showErrorPage } from './ErrorPage';
import { renderLayout } from './renderLayout';

export async function bootstrap(plugins: PluginManifest[]) {

  const app = new App(plugins);
  app.registerServices();

  const appBootstrap = app.getServiceInjector().resolveServiceByClass(AppBootstrap);

  try {
    await app.initializeServices();
    await appBootstrap.register();
    await app.loadServices();
    await app.load();
    await app.initializePlugins();
    await appBootstrap.load();
    await appBootstrap.doAfterPluginsInit();
    await app.load();

    renderLayout(app.getServiceInjector());
  } catch (e) {
    console.log(e);
    showErrorPage();
    throw e;
  }
}
