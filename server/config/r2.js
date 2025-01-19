import AWS from 'aws-sdk';

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const endpointUrl = `https://${accountId}.r2.cloudflarestorage.com`;

const R2 = new AWS.S3({
    endpoint: endpointUrl,
    accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,
    region: 'auto'
});

export const BUCKET_NAME = process.env.CLOUDFLARE_BUCKET_NAME;
export const PUBLIC_URL = process.env.CLOUDFLARE_PUBLIC_URL;

export default R2; 