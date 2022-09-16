APPLICATION_NAME="vanilla-django"

AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text --profile $PROFILE)


docker image build -f app/Dockerfile.prod -t ${APPLICATION_NAME} ./app

docker image tag ${APPLICATION_NAME} ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${APPLICATION_NAME}
aws ecr get-login-password --region ${REGION} --profile ${PROFILE} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker image push ${AWS_ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${APPLICATION_NAME}
