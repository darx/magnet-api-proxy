# magnet-api-proxy

Simple unofficial API which interfaces [MagnetDl](https://www.magnetdl.com/) (more coming soon) & [OMDb](https://www.omdbapi.com/); deployable and tested using [AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html).

#### Getting started

```bash
git clone https://github.com/darx/magnet-api-proxy.git
cd magnet-api-proxy
npm ci
(ehco PROXY_HOSTNAME= && ehco PROXY_USER_ID= && ehco PROXY_PASSWORD= && ehco OMDB_API= && echo OMDB_HOSTNAME= && ehco HOSTNAME_MAGNETDL= && ehco AWS_REGION= && ehco AWS_ACCESSKEYID= && ehco AWS_SECRETACCESSKEYID= && ehco AWS_S3_CACHE_BUCKET=) > .env
```

#### Working/Developing locally

```bash
npm run test:server
```

#### Bundle for AWS Lambda

Generates bundle.zip file in root directory of the project which is ready for deployment.

```bash
npm run bundle
```
