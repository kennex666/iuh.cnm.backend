FROM node:18-alpine
WORKDIR /app
COPY package.json /app/
RUN npm install
COPY . /app/
EXPOSE 8088
CMD [ "node", "src/app.js" ]