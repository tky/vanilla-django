export ACCOUNT="YOUR ACCOUNT ID"
export PROFIILE="YOUR AWS NAMED PROFILE"
export REGION="YOUR REGION"

Create a ECR Repository.



```
$ aws ssm start-session --target {EC2 INSTANCE ID} --region {REGION} --profile {PROFILE}
```

```
$ sudo apt-get update
$ sudo apt-get install postgresql-client
```

```
$ psql -h djangordsstack-db4924f778-esqllihfcayt.c087ji9bgiut.ap-northeast-2.rds.amazonaws.com -U root postgres

postgres=> create database hello_django_dev;
CREATE DATABASE
```


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

```
$ python manage.py migrate --noinput
```

```
$ python manage.py createsuperuser

Username (leave blank to use 'root'): admin
Email address: admin@example.com
Password:
Password (again):
Superuser created successfully.
```


## Reference

Thanks a lot :)

- https://docs.djangoproject.com/en/1.8/
- https://testdriven.io/blog/deploying-django-to-ecs-with-terraform/
- https://anikitech.com/amazon-ecsdjangonginx-part3/
- https://qiita.com/kazama1209/items/667fbd7fcea83602ab27
