import path from 'path';

// GCP
import { Storage } from '@google-cloud/storage';

const gcpStorage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
});
const gcpBucket = gcpStorage.bucket(process.env.GCP_BUCKET_NAME!);

// Cloudinary
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadProvider = 'gcp' | 'cloudinary';

export async function uploadProfileImage({
  provider,
  userId,
  file,
}: {
  provider: UploadProvider;
  userId: string;
  file: Express.Multer.File;
}): Promise<string> {
  if (provider === 'gcp') {
    const ext = path.extname(file.originalname) || '.jpg';
    const gcsFileName = `profile-pics/${userId}/profile${ext}`;
    const gcsFile = gcpBucket.file(gcsFileName);
    await gcsFile.save(file.buffer, {
      contentType: file.mimetype,
      public: false,
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      },
    });
    const [url] = await gcsFile.getSignedUrl({
      action: 'read',
      expires: Date.now() + Number(process.env.GCP_SIGNED_URL_EXPIRATION || 600) * 1000,
    });
    return url;
  } else if (provider === 'cloudinary') {
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          {
            folder: `profile-pics/${userId}`,
            public_id: 'profile',
            overwrite: true,
            resource_type: 'image',
          },
          (error: any, result: any) => {
            if (error) reject(error);
            resolve(result);
          },
        )
        .end(file.buffer);
    });
    return uploadResult.secure_url;
  } else {
    throw new Error('Unsupported provider');
  }
}

export async function deleteProfileImage({
  provider,
  userId,
  previousUrl,
}: {
  provider: UploadProvider;
  userId: string;
  previousUrl: string;
}): Promise<void> {
  if (provider === 'gcp') {
    const match = previousUrl.match(/\/profile-pics\/([^?]+)/);
    if (match && match[1]) {
      const oldPath = `profile-pics/${userId}/${match[1].split('/').slice(1).join('/')}`;
      await gcpBucket.file(oldPath).delete({ ignoreNotFound: true });
    }
  } else if (provider === 'cloudinary') {
    await cloudinary.uploader.destroy(`profile-pics/${userId}/profile`, { resource_type: 'image' });
  }
}
