/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambdanodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import grantSecret from '../util/grantSecret';

export class BakeryLeaderboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const RIOT_API_SECRET_ENV_KEY = 'RIOT_API_SECRET';
    const DB_SECRET_ENV_KEY = 'DB_SECRET';
    const MATCHES_TABLE_NAME_ENV_KEY = 'MATCHES_TABLE_NAME';

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
      credentials: rds.Credentials.fromGeneratedSecret('admin'), // auto-generate the password
      instanceProps: {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE2, ec2.InstanceSize.SMALL),
        vpc,
      },
      defaultDatabaseName: 'BakeryLeaderboardDatabase',
    });

    const auroraClusterSecret = auroraCluster.secret || new secretsmanager.Secret(this, 'AuroraClusterSecret', {
      secretName: 'AURORA_CLUSTER_SECRET',
    });

    // DynamoDB
    const matchesDynamoDbTable = new dynamodb.Table(this, 'MatchesDynamoDbTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'Matches',
    });

    const summonerSourceLambda = new lambdanodejs.NodejsFunction(this, 'SummonerSourceLambda', {
      entry: '/node_modules/BakeryLeaderboardSyncService/src/lambda/sourceSummoners/index.ts',
    });

    const sourceMatchesLambda = new lambdanodejs.NodejsFunction(this, 'SourceMatchesLambda', {
      entry: '/node_modules/BakeryLeaderboardSyncService/src/lambda/sourceMatches/index.ts',
    });

    const getMatchIdsForSummonerLambda = new lambdanodejs.NodejsFunction(this, 'GetMatchIdsForSummonerLambda', {
    });

    const summonerMatchFetchRequestQueue = new sqs.Queue(this, 'SummonerMatchFetchRequestQueue', {
    });

    const fetchMatchQueue = new sqs.Queue(this, 'FetchMatchQueue', {
    });

    // Step Functions
    const checkIfMatchExistsLambda = new lambdanodejs.NodejsFunction(this, 'CheckIfMatchExistsLambda', {});
    const fetchMatchAndInsertLambda = new lambdanodejs.NodejsFunction(this, 'FetchMatchAndInsertLambda', {
    });

    const checkIfMatchExistsTask = new tasks.LambdaInvoke(this, 'CheckIfMatchExistsInvocation', {
      lambdaFunction: checkIfMatchExistsLambda,
    });

    const fetchMatchAndInsertTask = new tasks.LambdaInvoke(this, 'FetchMatchAndInsertInvocation', {
      lambdaFunction: fetchMatchAndInsertLambda,
    });

    const doesMatchExistChoiceState = new sfn.Choice(this, 'DoesMatchExistChoice')
      .when(sfn.Condition.booleanEquals('$.doesMatchExist', false), fetchMatchAndInsertTask);

    const matchSourceDefinition = checkIfMatchExistsTask.next(doesMatchExistChoiceState);

    const sourceMatchesEvent = new events.Rule(this, 'SourceMatchesEvent', {
      targets: [new targets.LambdaFunction(sourceMatchesLambda)],
      schedule: events.Schedule.rate(cdk.Duration.minutes(30)),
    });

    // Queue permissions
    fetchMatchQueue.grantSendMessages(getMatchIdsForSummonerLambda);
    getMatchIdsForSummonerLambda.addEnvironment('FETCH_MATCH_QUEUE_URL', fetchMatchQueue.queueUrl);

    summonerMatchFetchRequestQueue.grantSendMessages(sourceMatchesLambda);
    sourceMatchesLambda.addEnvironment('SUMMONER_MATCH_FETCH_REQUEST_QUEUE_URL', summonerMatchFetchRequestQueue.queueUrl);

    // DynamoDB permissions
    matchesDynamoDbTable.grantReadData(checkIfMatchExistsLambda);
    checkIfMatchExistsLambda.addEnvironment(
      MATCHES_TABLE_NAME_ENV_KEY,
      matchesDynamoDbTable.tableName,
    );

    matchesDynamoDbTable.grantWriteData(fetchMatchAndInsertLambda);
    fetchMatchAndInsertLambda.addEnvironment(
      MATCHES_TABLE_NAME_ENV_KEY,
      matchesDynamoDbTable.tableName,
    );

    // Grant access to Riot API key
    grantSecret(riotApiSecret, summonerSourceLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, getMatchIdsForSummonerLambda, RIOT_API_SECRET_ENV_KEY);
    grantSecret(riotApiSecret, fetchMatchAndInsertLambda, RIOT_API_SECRET_ENV_KEY);

    // Grant acceess to DB connection parameters
    grantSecret(auroraClusterSecret, summonerSourceLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(summonerSourceLambda);
    grantSecret(auroraClusterSecret, sourceMatchesLambda, DB_SECRET_ENV_KEY);
    auroraCluster.connections.allowDefaultPortFrom(sourceMatchesLambda);
  }
}
