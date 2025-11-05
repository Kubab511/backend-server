FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "api/index.js"]
