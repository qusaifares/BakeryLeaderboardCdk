/* eslint-disable @typescript-eslint/no-unused-vars */
import 'reflect-metadata';
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdanodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import path = require('path');
import grantSecret from '../util/grantSecret';
import { setLambdaNodeEnv } from '../util/setLambdaNodeEnv';
import { getPublicIp } from '../util/getPublicIp';
import { SourceMatchesEvent, SourceMatchesEventType } from '../SyncService/shared/types/message/SourceMatchesEvent';
import '../util/augmentation/string-augmentation';

const LAMBDA_HANDLERS_PATH = path.join(__dirname, '../SyncService/handler');

export class BakeryLeaderboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const RIOT_API_SECRET_ENV_KEY = 'RIOT_API_SECRET';
    const DB_SECRET_ENV_KEY = 'DB_SECRET';

    // Create a new VPC or use an existing one
    const vpc = new ec2.Vpc(this, 'MyVpc');

    const riotApiSecret = new secretsmanager.Secret(this, 'RiotApiSecret', {
      secretName: 'RIOT_API',
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security Group for EC2 instance',
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Allow whitelisted IP to access port 5432',
      allowAllOutbound: true,
    });

    getPublicIp().then((ip) => {
      if (!ip) return;

      ec2SecurityGroup.addIngressRule(ec2.Peer.ipv4(`${ip}/32`), ec2.Port.tcp(22), 'Allow SSH access from my IP');
    });
    rdsSecurityGroup.addIngressRule(ec2SecurityGroup, ec2.Port.tcp(5432), 'Allow postgres traffic from EC2 SG');

    const ec2Instance = new ec2.Instance(this, 'DatabaseProxyInstance', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage({
        generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      }),
      vpc,
      associatePublicIpAddress: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: ec2SecurityGroup,
      keyName: 'qusai-us-east-2',
    });

    // Define the Aurora Database cluster
    const auroraCluster = new rds.DatabaseCluster(this, 'BakeryLeaderboardDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('qusai'), // auto-generate the password
      readers: [rds.ClusterInstance.serverlessV2('Reader1', { scaleWithWriter: true })],
      writer: rds.ClusterInstance.provisioned('Writer'),
      // removalPolicy: cdk.RemovalPolicy.RETAIN,
      // deletionProtection: true,
      defaultDatabaseName: 'BakeryLeaderboard',
      vpc,
      securityGroups: [rdsSecurityGroup],
    });

    const auroraClusterSecret = auroraCluster.secret || new secretsmanager.Secret(this, 'AuroraClusterSecret', {
      secretName: 'AURORA_CLUSTER_SECRET',
    });

    const summonerSourceLambda = new lambdanodejs.NodejsFunction(this, 'SummonerSourceLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'sourceSummoners/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(15),
    });

    const sourceMatchesLambda = new lambdanodejs.NodejsFunction(this, 'SourceMatchesLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'sourceMatches/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(15),
    });

    const getMatchIdsForSummonerLambda = new lambdanodejs.NodejsFunction(this, 'GetMatchIdsForSummonerLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'getMatchIdsForSummoner/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(15),
    });

    const summonerMatchFetchRequestDlq = new sqs.Queue(this, 'SummonerMatchFetchRequestDlq', {
      retentionPeriod: cdk.Duration.days(7),
    });
    const summonerMatchFetchRequestQueue = new sqs.Queue(this, 'SummonerMatchFetchRequestQueue', {
      deadLetterQueue: {
        queue: summonerMatchFetchRequestDlq,
        maxReceiveCount: 5,
      },
    });

    const matchIdProcessingDlq = new sqs.Queue(this, 'MatchIdProcessingDlq', {
      retentionPeriod: cdk.Duration.days(7),
    });
    const matchIdProcessingQueue = new sqs.Queue(this, 'MatchIdProcessingQueue', {
      deadLetterQueue: {
        queue: matchIdProcessingDlq,
        maxReceiveCount: 5,
      },
    });

    // Step Functions
    const checkMatchExistenceLambda = new lambdanodejs.NodejsFunction(this, 'CheckMatchExistenceLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'checkMatchExistence/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(10),
    });

    const fetchAndInsertMatchDataLambda = new lambdanodejs.NodejsFunction(this, 'FetchAndInsertMatchDataLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'fetchAndInsertMatchData/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(15),
    });

    const checkIfMatchExistsTask = new tasks.LambdaInvoke(this, 'CheckIfMatchExistsInvocation', {
      lambdaFunction: checkMatchExistenceLambda,
      outputPath: '$.Payload',
    });

    const fetchMatchAndInsertTask = new tasks.LambdaInvoke(this, 'FetchMatchAndInsertInvocation', {
      lambdaFunction: fetchAndInsertMatchDataLambda,
    });

    checkIfMatchExistsTask.addRetry({
      maxAttempts: 3,
      interval: cdk.Duration.seconds(10),
      backoffRate: 2,
    });
    fetchMatchAndInsertTask.addRetry({
      maxAttempts: 3,
      interval: cdk.Duration.seconds(10),
      backoffRate: 2,
    });

    const doesMatchExistChoiceState = new sfn.Choice(this, 'DoesMatchExistChoice')
      .when(sfn.Condition.booleanEquals('$.doesMatchExist', false), fetchMatchAndInsertTask);

    const matchSourceDefinition = checkIfMatchExistsTask.next(doesMatchExistChoiceState);

    const matchSourceStateMachine = new sfn.StateMachine(this, 'MatchSourceStateMachine', {
      definitionBody: sfn.DefinitionBody.fromChainable(matchSourceDefinition),
    });

    const matchSourceStateMachineTriggerLambda = new lambdanodejs.NodejsFunction(this, 'MatchSourceStateMachineTriggerLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'matchSourceStateMachineTrigger/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      environment: {
        STATE_MACHINE_ARN: matchSourceStateMachine.stateMachineArn,
      },
      vpc,
    });

    const syncSummonerStatsLambda = new lambdanodejs.NodejsFunction(this, 'SyncSummonerStatsLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'syncSummonerStats/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(10),
    });

    const syncSummonerStatsFromScratchLambda = new lambdanodejs.NodejsFunction(this, 'SyncSummonerStatsFromScratchLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'syncSummonerStatsFromScratch/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
      timeout: cdk.Duration.seconds(15),
    });

    const sourceMatchesEventInput: SourceMatchesEvent = {
      type: SourceMatchesEventType.INTERVAL,
      interval: {
        hours: 2,
      },
    };

    const sourceMatchesEvent = new events.Rule(this, 'SourceMatchesEvent', {
      targets: [
        new targets.LambdaFunction(
          sourceMatchesLambda,
          {
            event: events.RuleTargetInput.fromObject(sourceMatchesEventInput),
          },
        )],
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
    });

    // Queue message send permissions
    matchIdProcessingQueue.grantSendMessages(getMatchIdsForSummonerLambda);
    getMatchIdsForSummonerLambda.addEnvironment('FETCH_MATCH_QUEUE_URL', matchIdProcessingQueue.queueUrl);

    summonerMatchFetchRequestQueue.grantSendMessages(sourceMatchesLambda);
    sourceMatchesLambda.addEnvironment('SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL', summonerMatchFetchRequestQueue.queueUrl);

    // Queue message consume permissions
    getMatchIdsForSummonerLambda.addEventSource(new SqsEventSource(summonerMatchFetchRequestQueue));
    summonerMatchFetchRequestQueue.grantConsumeMessages(getMatchIdsForSummonerLambda);

    matchSourceStateMachineTriggerLambda.addEventSource(new SqsEventSource(matchIdProcessingQueue));
    matchIdProcessingQueue.grantConsumeMessages(matchSourceStateMachineTriggerLambda);

    // Lambda trigger permission
    syncSummonerStatsLambda.grantInvoke(fetchAndInsertMatchDataLambda);
    fetchAndInsertMatchDataLambda.addEnvironment('SYNC_SUMMONER_STATS_LAMBDA_ARN', syncSummonerStatsLambda.functionArn);

    // State machine start execution
    matchSourceStateMachine.grantStartExecution(matchSourceStateMachineTriggerLambda);

    // Grant access to Riot API key
    grantSecret(riotApiSecret, summonerSourceLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, getMatchIdsForSummonerLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, fetchAndInsertMatchDataLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, syncSummonerStatsLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, syncSummonerStatsFromScratchLambda, RIOT_API_SECRET_ENV_KEY);

    // Grant acceess to DB connection parameters
    grantSecret(auroraClusterSecret, summonerSourceLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(summonerSourceLambda);
    grantSecret(auroraClusterSecret, sourceMatchesLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(sourceMatchesLambda);
    grantSecret(auroraClusterSecret, checkMatchExistenceLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(checkMatchExistenceLambda);
    grantSecret(auroraClusterSecret, fetchAndInsertMatchDataLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(fetchAndInsertMatchDataLambda);
    grantSecret(auroraClusterSecret, syncSummonerStatsLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(syncSummonerStatsLambda);
    grantSecret(auroraClusterSecret, syncSummonerStatsFromScratchLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(syncSummonerStatsFromScratchLambda);

    setLambdaNodeEnv(
      summonerSourceLambda,
      sourceMatchesLambda,
      getMatchIdsForSummonerLambda,
      matchSourceStateMachineTriggerLambda,
      checkMatchExistenceLambda,
      fetchAndInsertMatchDataLambda,
      syncSummonerStatsLambda,
      syncSummonerStatsFromScratchLambda,
    );
  }
}
