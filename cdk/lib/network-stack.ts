import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import { Construct } from 'constructs';

interface NetworkProps extends StackProps {
  readonly cidr: string,
  readonly cidrMask: number
}

export class NetworkStack extends Stack {
  public readonly vpc: ec2.IVpc;
  public readonly sgDb: ec2.SecurityGroup;
  public readonly sgContainer: ec2.SecurityGroup;
  public readonly sgContainerLB: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkProps) {
    super(scope, id, props);
    const cidrMask = props.cidrMask;

    const vpc = new ec2.Vpc(this, "VPC", {
      cidr: props.cidr,
      maxAzs: 2,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        { cidrMask, name: 'public-subnet', subnetType: ec2.SubnetType.PUBLIC, },
        { cidrMask, name: 'private-subnet', subnetType: ec2.SubnetType.PRIVATE }, 
        { cidrMask, name: 'isolated-subnet', subnetType: ec2.SubnetType.ISOLATED }, 
      ],
    });
    this.vpc = vpc;

    this.sgDb = new ec2.SecurityGroup(this, 'sgDb', {
      vpc,
      description: "Security Group of a database",
      securityGroupName: "django-database",
      allowAllOutbound: true
    });

    this.sgContainer = new ec2.SecurityGroup(this, 'sgContainer', {
      vpc,
      description: "Security Group of a container",
      securityGroupName: "django-container",
      allowAllOutbound: true
    });

    this.sgContainerLB = new ec2.SecurityGroup(this, 'sgContaienrLB', {
      vpc,
      description: "Security Group of a LB facing internal containers",
      securityGroupName: "django-container-lb",
      allowAllOutbound: true
    });

    // the application container -> DB
    this.sgDb.connections.allowFrom(new ec2.Connections({
      securityGroups: [this.sgContainer]
    }), ec2.Port.tcp(5432), "allow from application container");

    // the load banacer -> applications
    this.sgContainer.connections.allowFrom(new ec2.Connections({
      securityGroups: [this.sgContainerLB]
    }), ec2.Port.tcp(8000), "allow from the internal load balancer");
  }
}
