const { S3Client } = require("@aws-sdk/client-s3");    
const { S3ClientMock } = require("../mockup/s3-client-mockup");

require("dotenv").config();

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKeyIam = process.env.ACCESS_KEY_IAM;
const secretAccessKeyIam = process.env.SECRET_ACCESS_KEY_IAM;
const folderImage = "chatApp-images";
const folderVideo = "chatApp-videos";
const folderEmoji = "chatApp-emojis";
const folderFile = "chatApp-files";

const videoMimeTypes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-ms-wmv',
    'video/x-msvideo',
    'video/x-flv',
    'video/webm',
    'video/3gpp',
    'video/3gpp2'
];

const emojiMimeTypes = [
    'image/png',
    'image/svg+xml',
    'image/gif'
];

const imageMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/jpg'
];

const fileMimeTypes = [
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];



let s3 = null;

if (!accessKeyIam || !secretAccessKeyIam) {
	console.log("No access key or secret key provided. Using mock S3 client.");
	s3 = new S3ClientMock(); // Giả lập client
} else {
	s3 = new S3Client({
		credentials: {
			accessKeyId: accessKeyIam,
			secretAccessKey: secretAccessKeyIam,
		},
		region: bucketRegion,
	});
}

module.exports = {
    s3,
    folderImage,
    folderVideo,
    videoMimeTypes,
    bucketName,
    bucketRegion,
    folderEmoji,
    folderFile,
    imageMimeTypes,
    emojiMimeTypes,
    fileMimeTypes,
}