FROM node:carbon

EXPOSE 3000
WORKDIR /usr/src/epub-press

COPY . .

RUN npm install

CMD ["npm", "run", "start:docker"]
