FROM alpine:3.10

RUN apk add curl jq

RUN curl -O https://downloads.azion.com/linux/x86_64/azioncli

RUN chmod +x azioncli

RUN cp azioncli /usr/local/bin

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]