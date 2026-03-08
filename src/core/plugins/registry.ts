import type { WebOSApp, AppDescriptor } from '../../types/plugin';
import { PLUGIN_API_VERSION } from '../../types/plugin';

const apps = new Map<string, WebOSApp>();
const lazy = new Map<string, { descriptor: AppDescriptor; load: () => Promise<WebOSApp> }>();

export const AppRegistry = {
  registerApp(app: WebOSApp): void {
    if (app.apiVersion !== PLUGIN_API_VERSION) {
      console.warn(`[AppRegistry] App ${app.id} apiVersion ${app.apiVersion} !== ${PLUGIN_API_VERSION}`);
    }
    apps.set(app.id, app);
  },

  /** Register an app that is loaded on first launch (code-splitting for low-spec). */
  registerLazy(descriptor: AppDescriptor, load: () => Promise<WebOSApp>): void {
    lazy.set(descriptor.id, { descriptor, load });
  },

  unregisterApp(id: string): void {
    apps.delete(id);
    lazy.delete(id);
  },

  getApp(id: string): WebOSApp | undefined {
    return apps.get(id);
  },

  /** Load app by id (resolves from lazy loader if not yet loaded). Used before launch. */
  async loadApp(id: string): Promise<WebOSApp | undefined> {
    const existing = apps.get(id);
    if (existing) return existing;
    const entry = lazy.get(id);
    if (!entry) return undefined;
    try {
      const app = await entry.load();
      if (app.apiVersion !== PLUGIN_API_VERSION) {
        console.warn(`[AppRegistry] App ${app.id} apiVersion ${app.apiVersion} !== ${PLUGIN_API_VERSION}`);
      }
      apps.set(id, app);
      lazy.delete(id);
      return app;
    } catch (e) {
      console.error(`[AppRegistry] Failed to load app ${id}:`, e);
      return undefined;
    }
  },

  getAllApps(): WebOSApp[] {
    return Array.from(apps.values());
  },

  /** Descriptors for all apps (sync + lazy) for home screen tiles. */
  getAllAppDescriptors(): AppDescriptor[] {
    const fromSync = Array.from(apps.values()).map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      category: a.category,
    }));
    const fromLazy = Array.from(lazy.values()).map((e) => e.descriptor);
    return [...fromSync, ...fromLazy];
  },

  getAppsByCategory(category: string): WebOSApp[] {
    return this.getAllApps().filter((a) => a.category === category);
  },
};
