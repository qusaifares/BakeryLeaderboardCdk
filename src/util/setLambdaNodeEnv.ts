import * as lambda from 'aws-cdk-lib/aws-lambda';
import { ENV } from '../SyncService/shared/utils/env';

export const setLambdaNodeEnv = (...lambdas: lambda.Function[]) => {
  lambdas.forEach((fn) => fn.addEnvironment('NODE_ENV', ENV));
};
