FROM alpine:3.10

RUN apk add curl jq

RUN curl -L https://github.com/aziontech/azion-cli/releases/download/0.46.0/azioncli_0.46.0_Linux_x86_64.tar.gz > azioncli.tar.gz

RUN tar -xzvf azioncli.tar.gz

RUN chmod +x azioncli

RUN cp azioncli /usr/local/bin

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]