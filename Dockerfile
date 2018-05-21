FROM alpine:3.7

RUN apk add --no-cache nodejs mediainfo yarn

# Server

COPY ./package.json /app/package.json

WORKDIR /app

RUN yarn install

# Frontend

COPY ./frontend/package.json /app/frontend/package.json

WORKDIR /app/frontend

RUN yarn install

COPY . /app

RUN yarn run build

VOLUME ["/app/frontend/build/"]

WORKDIR /app

EXPOSE 3030
EXPOSE 3031

CMD [ "yarn", "run", "server" ]
