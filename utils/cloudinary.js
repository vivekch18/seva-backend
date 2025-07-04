import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// ✅ Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// ✅ Create storage engine for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'uploads', // Cloudinary folder name
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`,
  },
});

export { cloudinary, storage };
