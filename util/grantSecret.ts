import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';

function assertEnvironmentVariableKeyInput(key: string) {
  if (key.length === 0) {
    throw new Error('environmentVariableKey cannot be empty.');
  }
}

export default function grantSecret(
  secret: secretsmanager.Secret,
  targetLambda: lambda.Function,
  environmentVariableKey: string,
) {
  assertEnvironmentVariableKeyInput(environmentVariableKey);

  secret.grantRead(targetLambda);
  targetLambda.addEnvironment(environmentVariableKey, secret.secretArn);
}
