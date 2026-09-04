# Dev-server image, used by the root docker-compose.yml for local testing.
# Production builds are static (`npm run build`) and deploy to Vercel — see web/README.md.
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
