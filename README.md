# magnet-api-proxy

Simple unofficial API which interfaces [MagnetDl](https://www.magnetdl.com/) (currently more coming soom) & [OMDb](https://www.omdbapi.com/); deployable and tested using [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html).
 
## Getting started

```bash
git clone https://github.com/darx/magnet-api-proxy.git
cd magnet-api-proxy
npm ci
```

## Environmental variables

```bash
(echo PROXY_HOSTNAME= && echo PROXY_USER_ID= && echo PROXY_PASSWORD= && echo PROXY_PORT= && echo HOSTNAME_MAGNETDL= && echo AWS_REGION= && echo AWS_ACCESS_KEY= && echo AWS_SECRET_ACCESS_KEY= && echo AWS_S3_BUCKET=) > .env

```
## Working/Developing locally

```bash
npm run test:server
```

## Working/Developing locally

```bash
npm run build
```