class S3ClientMock {
	async upload(params) {
		console.log("[Mock] Uploading file to S3:", params);
		// Trả về giả lập location như S3 thật
		return {
			Location: `https://mock-s3.com/${params.Bucket}/${params.Key}`,
			Bucket: params.Bucket,
			Key: params.Key,
			ETag: '"mock-etag"',
		};
	}

	async getObject(params) {
		console.log("[Mock] Getting file from S3:", params);
		// Trả về object giả lập (ví dụ là buffer hoặc stream)
		return {
			Body: Buffer.from("This is mock file content from S3"),
			ContentType: "text/plain",
		};
	}

	async deleteObject(params) {
		console.log("[Mock] Deleting file from S3:", params);
		// Trả về kết quả giả lập
		return {
			DeleteMarker: true,
			VersionId: "mock-version-id",
		};
	}
}

module.exports = { S3ClientMock };
