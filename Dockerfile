FROM alpine:3.10

RUN apk add curl jq

RUN curl -L https://downloads.azion.com/linux/x86_64/azioncli-0.50.0 > azioncli

RUN chmod +x azioncli

RUN cp azioncli /usr/local/bin

COPY entrypoint.sh /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]