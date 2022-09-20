import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as rds from "aws-cdk-lib/aws-rds";

interface RdsProps extends StackProps {
  readonly vpc: ec2.IVpc
  readonly securityGroup: ec2.SecurityGroup
  readonly multiAz: boolean
  readonly instanceType: ec2.InstanceType
}

export class RdsStack extends Stack {
  public readonly credentials: rds.Credentials;
  public readonly instance: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: RdsProps) {
    super(scope, id, props);

    this.credentials = 
      rds.Credentials.fromGeneratedSecret('root', { secretName: "vanilla-django-db-secret" });

    this.instance = new rds.DatabaseInstance(this, 'DB', {
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [props.securityGroup],
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13_3
      }),
      instanceType: props.instanceType,
      credentials: this.credentials,
      multiAz: props.multiAz,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      deleteAutomatedBackups: true,
      deletionProtection: false,
      databaseName: 'karte',
      publiclyAccessible: false,
    });
  }
}

