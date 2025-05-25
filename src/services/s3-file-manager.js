const { PutObjectCommand, ObjectCannedACL, DeleteObjectCommand } = require("@aws-sdk/client-s3");
const { v4: uuidv4 } = require("uuid");
const { s3,
    folderImage,
    folderVideo,
    videoMimeTypes,
    bucketName,
    bucketRegion,
    folderEmoji,
    folderFile,
    imageMimeTypes,
    emojiMimeTypes,
    fileMimeTypes, } = require("../configs/aws");


class S3FileManager {
    generateUniqueFileName(originalFileName) {
        const lastDotIndex = originalFileName.lastIndexOf('.');
        if (lastDotIndex === -1) {
            return `${originalFileName}-${uuidv4()}`;
        }

        const baseName = originalFileName.substring(0, lastDotIndex);
        const extension = originalFileName.substring(lastDotIndex + 1);
        return `${baseName}-${uuidv4()}.${extension}`;
    };

    getFolderName(contentType) {
        if (videoMimeTypes.includes(contentType)) return folderVideo;
        if (emojiMimeTypes.includes(contentType)) return folderEmoji;
        if (imageMimeTypes.includes(contentType)) return folderImage;
        if (fileMimeTypes.includes(contentType)) return folderFile;
        console.warn("Unknown content type. Defaulting to image folder.");
        return folderImage;
    }

    //Push object
    /**
     * @param {Object} file
     * @param {Buffer} file.buffer
     * @param {string} file.contentType 
     * @param {string} file.fileName 
     */
    async pushObjectS3(file) {
        if (!file.buffer || !file.fileName) {
            console.error("Invalid file data provided");
            return null;
        }

        try {
            // const folderName = videoMimeTypes.includes(file.contentType) ? folderVideo : folderImage;
            // let folderName;
            // if (videoMimeTypes.includes(file.contentType)) {
            //     folderName = folderVideo;
            // } else if (emojiMimeTypes.includes(file.contentType)) {
            //     folderName = folderEmoji;
            // } else if (imageMimeTypes.includes(file.contentType)) {
            //     folderName = folderImage;
            // } else if (fileMimeTypes.includes(file.contentType)) {
            //     folderName = folderFile;
            // } else {
            //     console.warn("Unknown content type. Defaulting to image folder.");
            //     folderName = folderImage;
            // }
            const folderName = this.getFolderName(file.contentType);
            const key = `${folderName}/${this.generateUniqueFileName(file.fileName)}`;

            const params = {
                Bucket: bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.contentType
            };

            const commandPushImage = new PutObjectCommand(params);
            await s3.send(commandPushImage);
            const strUrl = `https://s3.${bucketRegion}.amazonaws.com/${bucketName}/${key}`;
            return { key: key, url: strUrl };
        } catch (error) {
            console.error(`Error when pushing object to S3:`, error);
            return null;
        }
    };

    //Push many object 
    /**
     * @param {Array} files
     * @param {Buffer} file.buffer
     * @param {string} file.contentType 
     * @param {string} file.fileName 
     */
    async pushManyObjectS3(files) {
        if (!files || files.length === 0) {
            return [];
        }

        try {
            const uploadPromises = files.map(file => this.pushObjectS3(file));
            const results = await Promise.all(uploadPromises);

            // Filter out null results
            return results.filter(url => url !== null);
        } catch (error) {
            console.error("Error in pushManyObjectS3:", error);
            return [];
        }
    };

    async deleteObjectS3(key) {
        if (!key) {
            console.warn("Attempted to delete object with empty key");
            return false;
        }

        try {
            const params = {
                Bucket: bucketName,
                Key: key
            };

            const command = new DeleteObjectCommand(params);
            await s3.send(command);
            return true;
        } catch (error) {
            console.error(`Error deleting file from S3 (key: ${key}):`, error);
            return false;
        }
    };

    // Delete many object 
    async deleteManyObjectS3(keys) {
        if (!keys || keys.length === 0) {
            return [];
        }

        try {
            const deletePromises = keys.map(key => this.deleteObjectS3(key));
            const deleteResults = await Promise.all(deletePromises);

            // Collect keys that failed to delete
            return keys.filter((key, index) => !deleteResults[index]);
        } catch (error) {
            console.error("Error in deleteManyObjectS3:", error);
            return keys; // Return all keys as failed if there's an error
        }
    };
}

module.exports = new S3FileManager();