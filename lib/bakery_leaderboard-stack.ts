/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable import/prefer-default-export */
import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sfn from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';

export class BakeryLeaderboardStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a new VPC or use an existing one
    const vpc = new ec2.Vpc(this, 'MyVpc');

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

    // DynamoDB
    const matchesDynamoDbTable = new dynamodb.Table(this, 'MatchesDynamoDbTable', {
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      tableName: 'Matches',
    });

    const summonerSourceLambda = new lambda.NodejsFunction(this, 'SummonerSourceLambda', {
      entry: '/node_modules/BakeryLeaderboardSummonerSourceLambda/src/index.ts',
    });

    const sourceMatchesLambda = new lambda.NodejsFunction(this, 'SourceMatchesLambda', {
    });

    const getMatchIdsForSummonerLambda = new lambda.NodejsFunction(this, 'GetMatchIdsForSummonerLambda', {
    });

    const summonersToFetchMatchesForQueue = new sqs.Queue(this, 'SummonersToFetchMatchesForQueue', {
    });

    const fetchMatchQueue = new sqs.Queue(this, 'FetchMatchQueue', {
    });

    fetchMatchQueue.grantSendMessages(getMatchIdsForSummonerLambda);
    summonersToFetchMatchesForQueue.grantSendMessages(sourceMatchesLambda);

    // Step Functions
    const checkIfMatchExistsLambda = new lambda.NodejsFunction(this, 'CheckIfMatchExistsLambda', {});
    const fetchMatchAndInsertLambda = new lambda.NodejsFunction(this, 'FetchMatchAndInsertLambda', {});

    const checkIfMatchExistsTask = new tasks.LambdaInvoke(this, 'CheckIfMatchExistsInvocation', {
      lambdaFunction: checkIfMatchExistsLambda,
    });

    const fetchMatchAndInsertTask = new tasks.LambdaInvoke(this, 'FetchMatchAndInsertInvocation', {
      lambdaFunction: fetchMatchAndInsertLambda,
    });

    const doesMatchExistChoiceState = new sfn.Choice(this, 'DoesMatchExistChoice')
      .when(sfn.Condition.booleanEquals('$.doesMatchExist', false), fetchMatchAndInsertTask);

    const matchSourceDefinition = checkIfMatchExistsTask.next(doesMatchExistChoiceState);
  }
}
