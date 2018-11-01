FROM node:carbon

EXPOSE 3000
WORKDIR /usr/src/epub-press
RUN npm install

COPY . .
CMD ["npm", "run", "start:docker"]
