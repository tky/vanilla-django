#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { NetworkStack } from '../lib/network-stack';
import { RdsStack } from '../lib/rds-stack';
import { ApplicationStack } from '../lib/application-stack';
import { AdminStack } from '../lib/admin-stack';

const app = new cdk.App();

process.env.MYBUCKET;

const env = { 
  account: process.env.ACCOUNT,
  region: process.env.REGION || 'ap-northeast-2'
};

const network = new NetworkStack(app, 'DjangoNetowrkStack', {
  env,
  cidr: '10.3.0.0/16',
  cidrMask: 24
});

const rds = new RdsStack(app, 'DjangoRdsStack', {
  env,
  vpc: network.vpc,
  multiAz: false,
  securityGroup: network.sgDb,
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.BURSTABLE3,
    ec2.InstanceSize.MICRO,
  ),
});

new ApplicationStack(app, 'DjangoApplicationStack', {
  env,
  clusterName: "vanilla-django",
  vpc: network.vpc,
  containerSubnets: network.vpc.privateSubnets,
  containerSecurityGroup: network.sgContainer,
  containerLBSecurityGroup: network.sgContainerLB,
  publicLoadBalancer: network.publicLB,
  desiredCount: 1,
  repository: "vanilla-django",
  nginxRepository: "vanilla-django-nginx",
  healthCheckPath: "/health_check",
  credentials: rds.credentials,
  dbHost: rds.instance.dbInstanceEndpointAddress
});

new AdminStack(app, 'DjangoAdminStack', {
  env,
  vpc: network.vpc,
  securityGroup: network.sgAdmin,
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T2,
    ec2.InstanceSize.MICRO,
  ),
  machineImage:
    ec2.MachineImage.genericLinux({
    'ap-northeast-2': 'ami-0e9bfdb247cc8de84'
  }),
});
