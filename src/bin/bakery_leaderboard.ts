#!/usr/bin/env node
/* eslint-disable no-new */
import * as cdk from 'aws-cdk-lib';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import '../util/augmentation/string-augmentation';
import 'source-map-support/register';
import { BakeryLeaderboardStack } from '../lib/bakery_leaderboard-stack';

const app = new cdk.App();
new BakeryLeaderboardStack(app, 'BakeryLeaderboardStack', {
  /* If you don't specify 'env', this stack will be environment-agnostic.
   * Account/Region-dependent features and context lookups will not work,
   * but a single synthesized template can be deployed anywhere. */

  /* Uncomment the next line to specialize this stack for the AWS Account
   * and Region that are implied by the current CLI configuration. */
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  /* Uncomment the next line if you know exactly what Account and Region you
   * want to deploy the stack to. */
  env: { account: '789658303834', region: 'us-east-2' },

  /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
});
