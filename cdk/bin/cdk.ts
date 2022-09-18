#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { NetworkStack } from '../lib/network-stack';
import { RdsStack } from '../lib/rds-stack';
import { ApplicationStack } from '../lib/application-stack';

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

new RdsStack(app, 'DjangoRdsStack', {
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
  healthCheckPath: "/health_check"
});
