#!/bin/sh

docker-compose build
aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 184563364297.dkr.ecr.ap-south-1.amazonaws.com
docker tag p5js-web-editor_app 184563364297.dkr.ecr.ap-south-1.amazonaws.com/sq/p5js:latest
docker push 184563364297.dkr.ecr.ap-south-1.amazonaws.com/sq/p5js:latest

aws ecs update-service --cluster sq-production --service p5js --force-new-deployment > /dev/null