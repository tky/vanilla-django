https://testdriven.io/blog/dockerizing-django-with-postgres-gunicorn-and-nginx/
https://docs.djangoproject.com/en/4.1/intro/install/

$ docker-compose build
$ docker-compose up

Run the migrations:

Execute the following command on the root directory.

```
$ docker-compose exec web python manage.py migrate --noinput
```

Ensure the default Django tables were created:


```
$ docker-compose exec db psql --username=hello_django --dbname=hello_django_dev

psql (13.0)
Type "help" for help.

hello_django_dev=# \l
                                          List of databases
       Name       |    Owner     | Encoding |  Collate   |   Ctype    |       Access privileges
------------------+--------------+----------+------------+------------+-------------------------------
 hello_django_dev | hello_django | UTF8     | en_US.utf8 | en_US.utf8 |
 postgres         | hello_django | UTF8     | en_US.utf8 | en_US.utf8 |
 template0        | hello_django | UTF8     | en_US.utf8 | en_US.utf8 | =c/hello_django              +
                  |              |          |            |            | hello_django=CTc/hello_django
 template1        | hello_django | UTF8     | en_US.utf8 | en_US.utf8 | =c/hello_django              +
                  |              |          |            |            | hello_django=CTc/hello_django
(4 rows)
```

You can get a welcome page

http://localhost:8080/


Production

Run on the gunicorn and access a page via nginx

$ docker-compose -f docker-compose.prod.yml up

http://localhost:1337/
