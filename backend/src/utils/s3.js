import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "../config/env.js";

function getClient() {
  if (!config.aws.region) {
    throw new Error("S3 region not configured");
  }
  return new S3Client({
    region: config.aws.region,
    credentials: config.aws.accessKeyId
      ? {
          accessKeyId: config.aws.accessKeyId,
          secretAccessKey: config.aws.secretAccessKey,
        }
      : undefined,
  });
}

export async function uploadToS3({ key, body, contentType }) {
  if (!config.aws.s3Bucket) {
    throw new Error("S3 bucket not configured");
  }

  const command = new PutObjectCommand({
    Bucket: config.aws.s3Bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  const client = getClient();
  await client.send(command);
  return `https://${config.aws.s3Bucket}.s3.${config.aws.region}.amazonaws.com/${key}`;
}
