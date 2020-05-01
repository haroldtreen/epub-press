FROM node:carbon

EXPOSE 3000
WORKDIR /usr/src/epub-press

COPY package.json package-lock.json ./
RUN npm install --production

COPY . .

CMD ["npm", "run", "start:docker"]
