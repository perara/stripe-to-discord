FROM node

RUN mkdir -p /app
COPY tools.js package.json index.js app.json /app/
WORKDIR /app
RUN npm install
EXPOSE 5000

CMD [ "node", "index.js" ]