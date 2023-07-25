ARG NODE_VERSION=18.16.0

FROM node:${NODE_VERSION}-alpine

RUN apk add curl npm bash git

ENV _ENVIRONMENT="production"

RUN npm install -g npm
RUN npm install -g yarn --force
RUN npm install -g pnpm
RUN npm install --global --force "https://github.com/jcbsfilho/vulcan#dev"

COPY . /

RUN npm install

# config CLI
RUN curl -L https://downloads.azion.com/linux/x86_64/azioncli-0.66.0 > azioncli
RUN chmod +x azioncli
RUN cp azioncli /usr/local/bin


RUN chmod +x /script.js


CMD ["node", "/script.js"]