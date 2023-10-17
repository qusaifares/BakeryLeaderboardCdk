/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
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

    // Define the Aurora Database cluster
    const auroraCluster = new rds.DatabaseCluster(this, 'BakeryLeaderboardDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('qusai'), // auto-generate the password
      readers: [rds.ClusterInstance.serverlessV2('Reader1')],
      writer: rds.ClusterInstance.provisioned('Writer'),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      deletionProtection: true,
      defaultDatabaseName: 'BakeryLeaderboard',
      vpc,
    });

    const auroraClusterSecret = auroraCluster.secret || new secretsmanager.Secret(this, 'AuroraClusterSecret', {
      secretName: 'AURORA_CLUSTER_SECRET',
    });

    const summonerSourceLambda = new lambdanodejs.NodejsFunction(this, 'SummonerSourceLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'sourceSummoners/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
    });

    const sourceMatchesLambda = new lambdanodejs.NodejsFunction(this, 'SourceMatchesLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'sourceMatches/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
    });

    const getMatchIdsForSummonerLambda = new lambdanodejs.NodejsFunction(this, 'GetMatchIdsForSummonerLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'getMatchIdsForSummoner/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
    });

    const summonerMatchFetchRequestQueue = new sqs.Queue(this, 'SummonerMatchFetchRequestQueue', {
    });

    const matchIdProcessingQueue = new sqs.Queue(this, 'MatchIdProcessingQueue', {
    });

    // Step Functions
    const checkMatchExistenceLambda = new lambdanodejs.NodejsFunction(this, 'CheckMatchExistenceLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'checkMatchExistence/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
    });
    const fetchAndInsertMatchDataLambda = new lambdanodejs.NodejsFunction(this, 'FetchAndInsertMatchDataLambda', {
      entry: path.join(LAMBDA_HANDLERS_PATH, 'fetchAndInsertMatchData/index.ts'),
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      vpc,
    });

    const checkIfMatchExistsTask = new tasks.LambdaInvoke(this, 'CheckIfMatchExistsInvocation', {
      lambdaFunction: checkMatchExistenceLambda,
    });

    const fetchMatchAndInsertTask = new tasks.LambdaInvoke(this, 'FetchMatchAndInsertInvocation', {
      lambdaFunction: fetchAndInsertMatchDataLambda,
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
    });

    const sourceMatchesEvent = new events.Rule(this, 'SourceMatchesEvent', {
      targets: [new targets.LambdaFunction(sourceMatchesLambda)],
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

    // Lambda trigger permission
    syncSummonerStatsLambda.grantInvoke(fetchAndInsertMatchDataLambda);
    fetchAndInsertMatchDataLambda.addEnvironment('SYNC_SUMMONER_STATS_LAMBDA_ARN', syncSummonerStatsLambda.functionArn);

    // State machine start execution
    matchSourceStateMachine.grantStartExecution(matchSourceStateMachineTriggerLambda);

    // Grant access to Riot API key
    grantSecret(riotApiSecret, summonerSourceLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, getMatchIdsForSummonerLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, fetchAndInsertMatchDataLambda, RIOT_API_SECRET_ENV_KEY);

    // Grant acceess to DB connection parameters
    grantSecret(auroraClusterSecret, summonerSourceLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(summonerSourceLambda);
    grantSecret(auroraClusterSecret, sourceMatchesLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(sourceMatchesLambda);
    grantSecret(auroraClusterSecret, sourceMatchesLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(checkMatchExistenceLambda);
    grantSecret(auroraClusterSecret, sourceMatchesLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(fetchAndInsertMatchDataLambda);
  }
}
