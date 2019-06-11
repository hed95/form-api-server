FROM digitalpatterns/node:latest

WORKDIR /app

RUN mkdir -p /app

ADD . /app/

RUN npm ci && npm run build-ts

RUN chown -R node:node /app

ENV NODE_ENV='production'

USER 1000

EXPOSE 8080

ENTRYPOINT exec npm run db:migrate && npm run start

