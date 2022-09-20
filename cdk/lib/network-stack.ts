import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
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
  public readonly sgPublicLB: ec2.SecurityGroupProps;
  public readonly publicLB: elbv2.ApplicationLoadBalancer

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
        { cidrMask, name: 'private-subnet', subnetType: ec2.SubnetType.PRIVATE_WITH_NAT },
        { cidrMask, name: 'isolated-subnet', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      ],
    });
    this.vpc = vpc;


    const publicLoadBalancerSg = new ec2.SecurityGroup(this, 'sg-public-lb', {
      vpc,
      description: "Security Group of a Public Load Balancer",
      securityGroupName: "django-public-lb-sg",
      allowAllOutbound: true
    });
    publicLoadBalancerSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80))
    publicLoadBalancerSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443))

    this.publicLB = new elbv2.ApplicationLoadBalancer(this, 'django-public-lb', {
      loadBalancerName: 'django-public-lb',
      vpc,
      securityGroup: publicLoadBalancerSg,
      internetFacing: true,
      vpcSubnets: { subnets: vpc.publicSubnets }
    });

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

    // application containers -> DB
    this.sgDb.connections.allowFrom(new ec2.Connections({
      securityGroups: [this.sgContainer]
    }), ec2.Port.tcp(5432), "allow from application container");

    // the ecs internal load banacer -> application containers
    this.sgContainer.connections.allowFrom(new ec2.Connections({
      securityGroups: [this.sgContainerLB]
    }), ec2.Port.tcp(8000), "allow from the internal load balancer");

    // the public load balancer -> the ecs internal load balancer
    publicLoadBalancerSg.connections.allowFrom(new ec2.Connections({
      securityGroups: [this.sgContainerLB]
    }), ec2.Port.tcp(80), "allow from the public load balancer");
  }
}
