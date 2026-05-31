const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const dotenv = require('dotenv');
dotenv.config();

const newFilename = require('path').extname;
const fs = require('fs');

const bucketName = process.env.S3_BUCKET || 'airbnb-clone-bucket'; // fallback for demo if missing
const s3Region = process.env.S3_REGION || 'us-east-1'; // fallback

let s3Client;
try {
  s3Client = new S3Client({
    region: s3Region,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    }
  });
} catch (error) {
  console.warn('Failed to initialize S3 client (check credentials in .env)', error);
}

const uploadToS3 = async (path, originalname, mimetype) => {
  if (!s3Client) {
    throw new Error('S3 client not initialized. Cannot upload to S3.');
  }
  const ext = newFilename(originalname);
  const newName = Date.now().toString() + ext;
  
  const fileContent = fs.readFileSync(path);

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: newName,
    Body: fileContent,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  return `https://${bucketName}.s3.amazonaws.com/${newName}`;
};

module.exports = { uploadToS3 };
