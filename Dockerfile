FROM node:16-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY tsconfig.json .
COPY ./src ./src/
RUN npx tsc

ENV BROWSERLESS_URL ws://127.0.0.1:3000
ENV NODE_ENV production

CMD [ "node", "dist/main" ]
EXPOSE 8080
