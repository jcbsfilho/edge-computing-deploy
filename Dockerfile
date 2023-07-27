ARG NODE_VERSION=18.16.0

FROM node:${NODE_VERSION}-alpine

RUN apk add curl npm bash git

ENV _ENVIRONMENT="production"
ARG VULCAN_VERSION="https://github.com/jcbsfilho/vulcan#dev"

RUN npm install -g npm
RUN npm install -g yarn --force
RUN npm install -g pnpm
RUN npm install --global --force ${VULCAN_VERSION}

COPY . /

RUN npm install

RUN chmod +x /script.js


CMD ["node", "/script.js"]