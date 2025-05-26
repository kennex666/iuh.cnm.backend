# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm install -g pm2 && npm install

COPY . .

EXPOSE 8081

CMD [ "pm2-runtime", "src/app.js" ]
