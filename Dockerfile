FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
COPY frontend/package.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:22-alpine

WORKDIR /app
COPY backend/package.json ./backend/package.json
RUN cd backend && npm install --omit=dev && npm cache clean --force
COPY backend/src ./backend/src
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

ENV NODE_ENV=production PORT=3000
EXPOSE 3000
USER node
CMD ["node", "backend/src/server.js"]
