FROM node:22-alpine

ENV TZ=UTC

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

CMD ["node", "src/index.js"]
