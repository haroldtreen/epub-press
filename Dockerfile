FROM node:latest

RUN apt-get update
RUN apt-get install -y default-jdk

EXPOSE 3000

ENV APP_ROOT /usr/src/epub-press
RUN cd $(npm root -g)/npm \
 && npm install fs-extra \
 && sed -i -e s/graceful-fs/fs-extra/ -e s/fs\.rename/fs\.move/ ./lib/utils/rename.js

RUN mkdir -p ${APP_ROOT}
WORKDIR ${APP_ROOT}

COPY . ${APP_ROOT}

RUN npm install -g node-gyp
RUN npm install -g pm2

RUN npm install

CMD pm2 start bin/www -i 0 --no-daemon --name="EpubPress"
