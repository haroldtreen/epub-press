FROM node:carbon

WORKDIR /usr/src/epub-press

COPY . .
RUN npm install
EXPOSE 3000
CMD ["npm", "run", "start:docker"]
