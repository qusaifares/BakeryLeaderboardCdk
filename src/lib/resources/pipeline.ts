import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import path from 'path';
import { Stage } from '../../types/Stage';
import { capitalized } from '../../util/augmentation/string-augmentation';

interface PipelineSecret {
  githubToken: string;
}

const GITHUB_TOKEN_SECRET_KEY: keyof PipelineSecret = 'githubToken';

export function createPipeline(scope: Construct) {
  const sourceOutput = new codepipeline.Artifact();

  const pipelineSecret = new secretsmanager.Secret(scope, 'BakeryLeaderboardPipelineSecret', {
  });

  const buildSpec = codebuild
    .BuildSpec
    .fromSourceFilename(path.join(__dirname, '../../../buildspec.yaml'));

  const project = new codebuild.PipelineProject(scope, 'MyProject', {
    buildSpec,
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_5_0,
    },
  });

  const pipeline = new codepipeline.Pipeline(scope, 'BakeryLeaderboardPipeline', {
    pipelineName: 'BakeryLeaderboardPipeline',
    restartExecutionOnUpdate: true,
  });

  const sourceAction = new codepipeline_actions.GitHubSourceAction({
    actionName: 'GitHub_Source',
    owner: 'qusaifares',
    repo: 'BakeryLeaderboardCdk',
    branch: 'main',
    oauthToken: pipelineSecret.secretValueFromJson(GITHUB_TOKEN_SECRET_KEY),
    output: sourceOutput,
  });

  const buildAction = new codepipeline_actions.CodeBuildAction({
    actionName: 'Build',
    project,
    input: sourceOutput,
    outputs: [new codepipeline.Artifact()],
  });

  const buildOutput = (buildAction.actionProperties.outputs || [])[0];

  if (!buildOutput) {
    throw new Error('No build output exists.');
  }

  pipeline.addStage({
    stageName: 'Source',
    actions: [sourceAction],
  });

  pipeline.addStage({
    stageName: 'Build',
    actions: [buildAction],
  });

  pipeline.addStage({
    stageName: 'DeployToTest',
    actions: [deployToStage(Stage.TEST, buildOutput)],
  });

  pipeline.addStage({
    stageName: 'Approval',
    actions: [
      new codepipeline_actions.ManualApprovalAction({
        actionName: 'ManualApproval',
        additionalInformation: 'Approve or Reject this change to deploy to Production',
        runOrder: 1, // ensure this is the first action in the stage
      }),
    ],
  });

  pipeline.addStage({
    stageName: 'DeployToProd',
    actions: [deployToStage(Stage.PROD, buildOutput)],
  });
}

const deployToStage = (stageName: Stage, inputArtifact: codepipeline.Artifact) => {
  const capitalizedStageName = capitalized(stageName);
  const cloudFormationAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
    actionName: `CFN_Deploy_${capitalizedStageName}`,
    stackName: `LambdaStack-${capitalizedStageName}`,
    templatePath: inputArtifact.atPath(path.join(__dirname, '../../template.yaml')), // path to CloudFormation template in the build artifact
    adminPermissions: true, // grants the action the permissions needed to create or update a stack
    runOrder: 1,
  });

  return cloudFormationAction;
};
