FROM node:20-alpine
WORKDIR /app
COPY vapotheme-intranet/package*.json ./
RUN npm install
COPY vapotheme-intranet/ .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
