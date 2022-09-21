export ACCOUNT="YOUR ACCOUNT ID"
export PROFIILE="YOUR AWS NAMED PROFILE"
export REGION="YOUR REGION"

Create a ECR Repository.

https://testdriven.io/blog/deploying-django-to-ecs-with-terraform/

https://anikitech.com/amazon-ecsdjangonginx-part3/
https://qiita.com/kazama1209/items/667fbd7fcea83602ab27

```
$ aws ecs list-tasks --cluster vanilla-django --profile {PROFILE} --region {REGION}
{
    "taskArns": [
        "arn:aws:ecs:ap-northeast-2:xxxxxxxx:task/vanilla-django/{YOUR TASK_ID}"
    ]
}
```

```
$ aws ecs execute-command --cluster vanilla-django --task {TASK_ID} --container vanilla-django --interactive --command "/bin/ash " --profile {PROFILE} --region {REGION}
```
