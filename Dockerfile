FROM node:12.16.0-alpine3.11

VOLUME [ "." ]

RUN mkdir -p /home/node/chat-app/node_modules && chown -R node:node /home/node/chat-app

WORKDIR /home/node/chat-app

COPY package*.json ./

USER node

RUN npm install

COPY --chown=node:node . .

EXPOSE 8080

EXPOSE 3000

CMD [ "node", "index.js" ]