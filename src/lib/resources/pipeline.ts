import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
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
    .fromSourceFilename('buildspec.yaml');

  const project = new codebuild.PipelineProject(scope, 'PipelineProject', {
    buildSpec,
    environment: {
      buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
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

  const buildOutput = new codepipeline.Artifact();

  const buildAction = new codepipeline_actions.CodeBuildAction({
    actionName: 'Build',
    project,
    input: sourceOutput,
    outputs: [buildOutput],
  });

  pipeline.addStage({
    stageName: 'Source',
    actions: [sourceAction],
  });

  pipeline.addStage({
    stageName: 'Build',
    actions: [buildAction],
  });

  // pipeline.addStage({
  //   stageName: 'Approval',
  //   actions: [
  //     new codepipeline_actions.ManualApprovalAction({
  //       actionName: 'ManualApproval',
  //       additionalInformation: 'Approve or Reject this change to deploy to Production',
  //       runOrder: 1, // ensure this is the first action in the stage
  //     }),
  //   ],
  // });

  pipeline.addStage({
    stageName: 'Prod',
    actions: [deployToStage(Stage.PROD, buildOutput)],
  });
}

const deployToStage = (stageName: Stage, inputArtifact: codepipeline.Artifact) => {
  const capitalizedStageName = capitalized(stageName);
  const cloudFormationAction = new codepipeline_actions.CloudFormationCreateUpdateStackAction({
    actionName: `CFN_Deploy_${capitalizedStageName}`,
    stackName: 'BakeryLeaderboardStack',
    templatePath: inputArtifact.atPath('cdk.out/template.yaml'), // path to CloudFormation template in the build artifact
    adminPermissions: true, // grants the action the permissions needed to create or update a stack
    runOrder: 1,
  });

  return cloudFormationAction;
};
