import * as constructs from 'constructs';
import * as cdk from "aws-cdk-lib"
import * as ecs from "aws-cdk-lib/aws-ecs"

// https://zenn.dev/xeres/articles/2021-12-08-aws-cdk-ecs-patterns-and-ecs-exec
export class EnableExecuteCommand implements cdk.IAspect {
  public visit(node: constructs.IConstruct): void {
    if (node instanceof ecs.CfnService) {
      node.addOverride('Properties.EnableExecuteCommand', true);
    }
  }
}
