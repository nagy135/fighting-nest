FROM node:alpine

RUN mkdir -p /usr/src/app
ENV PORT 3000

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app

# Production use node instead of root
# USER node

RUN yarn config set ignore-engines true

RUN yarn

RUN yarn global add prisma next


# RUN prisma generate

# RUN prisma migrate dev

EXPOSE 3000
CMD [ "yarn", "start" ]
