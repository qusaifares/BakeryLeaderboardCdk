import { ProxyConfig } from './ProxyConfig';
import { ManagerConfig } from './ManagerConfig';
import { AwsConfig } from './AwsConfig';
import { RiotConfig } from './RiotConfig';

class Config {
  private managerConfig: ManagerConfig;

  private proxyConfig: ProxyConfig;

  private awsConfig: AwsConfig;

  private riotConfig: RiotConfig;

  // constructor() {}

  getManagerConfig() {
    if (!this.managerConfig) {
      this.managerConfig = new ManagerConfig(
        this.getAwsConfig(),
        this.getRiotConfig(),
        this.getProxyConfig(),
      );
    }
    return this.managerConfig;
  }

  getProxyConfig() {
    if (!this.proxyConfig) {
      this.proxyConfig = new ProxyConfig(this.getAwsConfig(), this.getRiotConfig());
    }
    return this.proxyConfig;
  }

  getAwsConfig() {
    if (!this.awsConfig) {
      this.awsConfig = new AwsConfig();
    }
    return this.awsConfig;
  }

  getRiotConfig() {
    if (!process.env.RIOT_API_SECRET) throw new Error('Unable to create RiotConfig instance. RIOT_API_SECRET environment variable is not defined');

    if (!this.riotConfig) {
      this.riotConfig = new RiotConfig({ apiKey: process.env.RIOT_API_SECRET });
    }
    return this.riotConfig;
  }
}

export const config = new Config();
