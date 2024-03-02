FROM node:12.13.1-alpine3.9

WORKDIR /usr/app

COPY ./src/package*.json ./

RUN npm install

COPY ./src .

EXPOSE 3000

CMD ["node", "index.js"]