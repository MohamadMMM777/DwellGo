const imageDownloader = require('image-downloader');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDest = path.join(__dirname, '..', 'uploads');
const photosMiddleware = multer({ dest: uploadDest });

const uploadByLink = async (req, res) => {
    const { link } = req.body;
    const newName = 'photo' + Date.now() + '.jpg';
    const destPath = path.join(uploadDest, newName);

    try {
        await imageDownloader.image({ url: link, dest: destPath });
        res.json(newName);
    } catch (err) {
        console.error('Upload by link error:', err);
        res.status(500).json('Failed to download image');
    }
};

const uploadFiles = async (req, res) => {
    try {
        const uploadedFiles = [];
        for (let i = 0; i < req.files.length; i++) {
            const { path: tempPath, originalname } = req.files[i];
            const ext = path.extname(originalname);
            const newName = Date.now().toString() + '-' + i + ext;
            const newPath = path.join(uploadDest, newName);

            fs.renameSync(tempPath, newPath);
            uploadedFiles.push(newName);
        }
        res.json(uploadedFiles);
    } catch (err) {
        console.error('Upload error:', err);
        res.status(500).json('Upload failed');
    }
};

module.exports = {
    photosMiddleware,
    uploadByLink,
    uploadFiles,
};
