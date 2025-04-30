FROM node:18-alpine

WORKDIR /app

# Install dependencies for bcrypt and Prisma
RUN apk add --no-cache openssl python3 make g++

COPY package.json ./
RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

RUN npm run build

# standalone モードで必要な静的ファイルをコピー
RUN mkdir -p .next/standalone/.next/static
RUN cp -R .next/static .next/standalone/.next/
RUN cp -R public .next/standalone/

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", ".next/standalone/server.js"] 