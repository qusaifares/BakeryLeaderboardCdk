import { AwsConfig } from './AwsConfig';
import { RiotProxy } from '../proxy/RiotProxy';
import { RiotConfig } from './RiotConfig';

export class ProxyConfig {
  private riotProxy: RiotProxy;

  constructor(private readonly awsConfig: AwsConfig, private readonly riotConfig: RiotConfig) {
  }

  public getRiotProxy() {
    if (!this.riotProxy) {
      this.riotProxy = new RiotProxy(this.riotConfig);
    }
    return this.riotProxy;
  }
}
