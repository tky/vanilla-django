import { Stack, StackProps } from 'aws-cdk-lib';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import { Construct } from 'constructs';
import { readFileSync } from 'fs';

interface AdminProps extends StackProps {
  readonly vpc: ec2.IVpc
  readonly securityGroup: ec2.SecurityGroup
  readonly instanceType: ec2.InstanceType
  readonly machineImage: ec2.IMachineImage
}

export class AdminStack extends Stack {
  constructor(scope: Construct, id: string, props: AdminProps) {
    super(scope, id, props);

    const userData = readFileSync('./user-data/init.sh', 'utf8');

    const role = new iam.Role(this, "vanilla-djang-admin-instance-role", {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonSSMManagedInstanceCore"
        ),
      ],
    });

    const instance = new ec2.Instance(this, 'admin-instance', {
      vpc: props.vpc,
      vpcSubnets: {
        subnets: props.vpc.privateSubnets
      },
      securityGroup: props.securityGroup,
      instanceType: props.instanceType,
      machineImage: props.machineImage,
      role
    });
    instance.addUserData(userData);
  }
}
