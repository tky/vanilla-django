import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { FargatePlatformVersion } from 'aws-cdk-lib/aws-ecs'
import { LogGroup } from "aws-cdk-lib/aws-logs";
import * as secrets from 'aws-cdk-lib/aws-secretsmanager'
import * as iam from "aws-cdk-lib/aws-iam";
import * as cdk from "aws-cdk-lib"
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as ecs_patterns from "aws-cdk-lib/aws-ecs-patterns"
import * as ecs from "aws-cdk-lib/aws-ecs"
import * as ecr from "aws-cdk-lib/aws-ecr"
import * as rds from "aws-cdk-lib/aws-rds";
import { EnableExecuteCommand } from './command'; 

interface ApplicationProps extends StackProps {
  readonly clusterName: string
  readonly vpc: ec2.IVpc
  readonly containerSubnets: ec2.ISubnet[]
  readonly containerSecurityGroup: ec2.SecurityGroup
  readonly containerLBSecurityGroup: ec2.SecurityGroup
  readonly desiredCount: number
  readonly publicLoadBalancer: elbv2.ApplicationLoadBalancer
  readonly repository: string
  readonly nginxRepository: string
  readonly healthCheckPath: string
  readonly credentials: rds.Credentials
  readonly dbHost: string
}

interface ApplicationLoadBalancedFargateServiceProps {
  readonly cluster: ecs.ICluster;
  readonly loadBalancer: elbv2.IApplicationLoadBalancer;
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly taskSubnets: ec2.SubnetSelection;
  readonly securityGroups: ec2.ISecurityGroup[];
  readonly desiredCount?: number;
  readonly healthCheckPath: string;
}

interface TaskDefinitionProps {
  repository: string;
  readonly nginxRepository: string
  readonly task: {
    family: string,
    cpu?: number,
    memoryLimitMiB?: number
  };
  readonly secrets?: {
    [key: string]: ecs.Secret;
  };
  readonly environment?: {
    [key: string]: string;
  }
}

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props: ApplicationProps) {
    super(scope, id, props);

    const cluster = new ecs.Cluster(this, props.clusterName, {
      vpc: props.vpc,
      clusterName: props.clusterName
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, `${props.clusterName}LB`, {
      loadBalancerName: `${props.clusterName}-elb`,
      vpc: props.vpc,
      securityGroup: props.containerLBSecurityGroup,
      internetFacing: false,
      vpcSubnets: { subnets: props.containerSubnets }
    });

    const dbSecret = secrets.Secret.fromSecretCompleteArn(
       this,
       "secret",
       "arn:aws:secretsmanager:ap-northeast-2:831823869380:secret:vanilla-django-db-secret-Mn44Cb"
     );

    /*
    const dbSecret = secrets.Secret.fromSecretNameV2(
       this,
       "secret",
       "vanilla-django-db-secret"
     );
     */


    const taskDefinition = buildTaskDefinition(this, props.clusterName,{
      repository: props.repository,
      nginxRepository: props.nginxRepository,
      task: {
        family: `${props.clusterName}-task`,
      },
      // YOU SHOULD GET THE CREDENTIAL FROM Secret Manager!!!
      environment: {
        SECRET_KEY: "vanilla",
        SQL_ENGINE: "django.db.backends.postgresql",
        SQL_DATABASE: "hello_django_dev",
        SQL_USER: props.credentials.username,
        SQL_HOST: props.dbHost,
        SQL_PORT: "5432",
        DATABASE: "postgres"
      },
      secrets: {
        SQL_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password')
      }
    });

    const service = buildApplicationLoadBalancedFargateService(this, `${props.clusterName}-service`, {
      ...props,
      securityGroups: [props.containerSecurityGroup],
      taskSubnets: { subnets: props.containerSubnets },
      loadBalancer,
      cluster,
      taskDefinition
    });

     props.publicLoadBalancer.addListener('public-loadbalancer-http-listener', {
       port: 80,
     }).addTargets('ECS', {
       port: 80,
       targets: [
         service.service.loadBalancerTarget({
         containerName: `${props.clusterName}-nginx`,
         containerPort: 80,
        }),
      ]
     }).configureHealthCheck( {
       path: props.healthCheckPath,
       interval: cdk.Duration.seconds(30),
       unhealthyThresholdCount: 10,
       port: "80"
     });
  }
}

const buildTaskDefinition = (scope: Construct, name: string, props: TaskDefinitionProps): ecs.FargateTaskDefinition => {
  const taskDefinition = new ecs.FargateTaskDefinition(scope, "djangoTaskDefinition", props.task);

  // TODO: Get a log group name form props.
  const logGroup = LogGroup.fromLogGroupName(scope, 'log-group', '/dev');

  taskDefinition.addContainer(`${name}-django-container`, {
    containerName: name,
    image: ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(scope, `${props.repository}-repository`, props.repository)),
      secrets: props.secrets,
      environment: props.environment,
      logging: new ecs.AwsLogDriver({ streamPrefix: `${name}-applicaiton`, logGroup }),
  });

  const nginx = taskDefinition.addContainer(`${name}-nginx-container`, {
    containerName: `${name}-nginx`,
    image: ecs.ContainerImage.fromEcrRepository(
      ecr.Repository.fromRepositoryName(scope, `${props.nginxRepository}-repository`, props.nginxRepository)),
      portMappings: [
        {
          protocol: ecs.Protocol.TCP,
          containerPort: 80
        }
      ],
      essential: true,
      logging: new ecs.AwsLogDriver({ streamPrefix: `${name}-nginx`, logGroup }),
  });

  taskDefinition.defaultContainer = nginx;

  return taskDefinition;
}

export const buildApplicationLoadBalancedFargateService = (scope: Construct, name: string, props: ApplicationLoadBalancedFargateServiceProps): ecs_patterns.ApplicationLoadBalancedFargateService => {
  const service = new ecs_patterns.ApplicationLoadBalancedFargateService(scope, name, {
    serviceName: name,
    cluster: props.cluster,
    loadBalancer: props.loadBalancer,
    taskDefinition: props.taskDefinition,
    desiredCount: props.desiredCount,
    minHealthyPercent:100,
    maxHealthyPercent: 200,
    assignPublicIp: false,
    publicLoadBalancer: false,
    taskSubnets: props.taskSubnets,
    securityGroups: props.securityGroups,
    platformVersion: FargatePlatformVersion.VERSION1_4
  });

  service.targetGroup.configureHealthCheck({
    path: props.healthCheckPath,
    interval: cdk.Duration.seconds(30),
    unhealthyThresholdCount: 10,
    port: "80",
  });

  service.taskDefinition.taskRole.addToPrincipalPolicy(
    new iam.PolicyStatement({
      actions: [
        'ssmmessages:CreateControlChannel',
        'ssmmessages:CreateDataChannel',
        'ssmmessages:OpenControlChannel',
        'ssmmessages:OpenDataChannel',
      ],
      resources: ['*'],
    }),
  );

  cdk.Aspects.of(service).add(new EnableExecuteCommand());

  return service;
}
