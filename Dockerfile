# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package.json package-lock.json* ./

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY . .

RUN npm install -g pm2

EXPOSE 8087

CMD [ "pm2-runtime", "src/app.js" ]
