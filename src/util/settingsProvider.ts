export class SettingsProvider {
  private static instance: SettingsProvider;
  private settings: { jsonRpcUrl: string };

  private constructor() {
    this.settings = {
      jsonRpcUrl: "http://localhost:8545",
    };
  }

  public static getInstance(): SettingsProvider {
    if (!SettingsProvider.instance) {
      SettingsProvider.instance = new SettingsProvider();
    }

    return SettingsProvider.instance;
  }

  public setSettings(settings: { jsonRpcUrl: string }) {
    this.settings = settings;
  }

  public getSettings() {
    return this.settings;
  }
}
