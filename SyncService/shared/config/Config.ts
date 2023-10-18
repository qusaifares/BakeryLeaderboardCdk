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

  getRiotConfig() {
    if (!this.riotConfig) {
      this.riotConfig = new RiotConfig(this.getAwsConfig().getSecretsCacheManager());
    }
    return this.riotConfig;
  }

  getManagerConfig() {
    if (!this.managerConfig) {
      this.managerConfig = new ManagerConfig(
        this.getAwsConfig(),
      );
    }
    return this.managerConfig;
  }

  getProxyConfig() {
    if (!this.proxyConfig) {
      this.proxyConfig = new ProxyConfig(this.getRiotConfig());
    }
    return this.proxyConfig;
  }

  getAwsConfig() {
    if (!this.awsConfig) {
      this.awsConfig = new AwsConfig();
    }
    return this.awsConfig;
  }
}

export const config = new Config();
