APPLICATION_NAME="vanilla-django-nginx"
DOCKERFILE="./nginx/Dockerfile.prod"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text --profile $PROFILE)

docker image build -f ${DOCKERFILE} -t ${APPLICATION_NAME} .

docker image tag ${APPLICATION_NAME} ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${APPLICATION_NAME}
aws ecr get-login-password --region ${REGION} --profile ${PROFILE} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker image push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${APPLICATION_NAME}
