FROM node:16
ENV PORT=8080

WORKDIR /usr/src/app
COPY package*.json ./
ENV DEBUG=express:*
RUN npm install
COPY . .
EXPOSE 8080
CMD [ "node", "server.js" ]