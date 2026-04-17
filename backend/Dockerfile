FROM node:24-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
RUN mkdir -p data uploads
EXPOSE 3001
CMD ["node", "--no-warnings", "src/index.js"]
