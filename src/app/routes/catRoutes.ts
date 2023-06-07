import multer from 'multer';
import path from 'path';

import { Application } from 'express';
import {
    uploadCatPic,
    deleteCatPic,
    updateCatPic,
    fetchCatPicById,
    fetchAllCatPics,
} from '../controllers/catController';
import { TEMP_DIR } from '../config/constants';

const storage = multer.diskStorage({
    destination: TEMP_DIR,
    filename: (req, file, cb) => {
        const uniqueId =
            Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        const fileExtension = path.extname(file.originalname);
        const fileName = `${uniqueId}${fileExtension}`;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage });

export default (app: Application) => {
    app.get('/cat', fetchAllCatPics);
    app.get('/cat/:id', fetchCatPicById);
    app.post('/cat', upload.single('image'), uploadCatPic);
    app.put('/cat/:id', upload.single('image'), updateCatPic);
    app.delete('/cat/:id', deleteCatPic);
};
