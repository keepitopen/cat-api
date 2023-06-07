FROM node:16.4.0
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm install pm2 -g
COPY process.config.js .
EXPOSE 3002
CMD ["pm2-runtime", "process.config.js"]