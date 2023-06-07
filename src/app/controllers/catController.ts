import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import mime from 'mime';

import { UPLOADS_DIR } from '../config/constants';

export async function uploadCatPic(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ error: 'Missing cat picture in the request.' });
        }

        const tmpPath = req.file?.path;

        const destinationPath = path.join(UPLOADS_DIR, req.file?.filename);

        await fs.promises.rename(tmpPath, destinationPath);

        const imageId = req.file?.filename.split('.')[0];

        return res.status(200).json({ imageId });
    } catch (error) {
        res.status(500).json({ error: 'Failed to upload cat picture.' });
    }
}

export async function deleteCatPic(req: Request, res: Response) {
    try {
        const imageId = req.params.id;

        const files = await fs.promises.readdir(UPLOADS_DIR);

        const matchingFiles = files.filter((file) => {
            const regex = new RegExp(`^${imageId}\\..*`, 'i');
            return regex.test(file);
        });

        if (matchingFiles.length === 0) {
            return res
                .status(404)
                .send({
                    message: `Cat picture with imageId: '${imageId}' not found.`,
                });
        }

        const filePath = path.join(UPLOADS_DIR, matchingFiles[0]);
        await fs.promises.unlink(filePath);

        res.status(200).send({
            message: `Cat picture with imageId: '${imageId}' deleted`,
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to delete cat picture.' });
    }
}

export async function updateCatPic(req: Request, res: Response) {
    try {
        if (!req.file) {
            return res
                .status(400)
                .json({ error: 'Missing cat picture in the request.' });
        }

        const imageId = req.params.id;
        const tmpPath = req.file?.path;
        const extension = req.file?.filename.split('.')[1];
        const destinationPath = path.join(
            UPLOADS_DIR,
            `${imageId}.${extension}`
        );

        const files = await fs.promises.readdir(UPLOADS_DIR);

        const matchingFiles = files.filter((file) => {
            const regex = new RegExp(`^${imageId}\\..*`, 'i');
            return regex.test(file);
        });

        if (matchingFiles.length === 0) {
            return res
                .status(404)
                .send({
                    message: `Cat picture with imageId: '${imageId}' not found.`,
                });
        }

        const filePath = path.join(UPLOADS_DIR, matchingFiles[0]);

        await fs.promises.unlink(filePath);

        const result = await new Promise((resolve, reject) => {
            fs.promises
                .rename(tmpPath, destinationPath)
                .then(() => resolve({ imageId: imageId }))
                .catch((error) => {
                    console.error('Error moving the file:', error);
                    reject(error);
                });
        });

        return res.status(200).json(result);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to update cat picture.' });
    }
}

export async function fetchCatPicById(req: Request, res: Response) {
    try {
        const imageId = req.params.id;

        const files = await fs.promises.readdir(UPLOADS_DIR);

        const regex = new RegExp(`^${imageId}\\.[^.]+$`);
        const matchingFiles = files.filter((file) => regex.test(file));

        if (matchingFiles.length === 0) {
            return res
                .status(400)
                .send({ error: 'No cat picture for this id found.' });
        }

        const result = matchingFiles[0];

        const fileData = await fs.promises.readFile(
            path.join(UPLOADS_DIR, result)
        );

        const contentType = mime.lookup(result);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', fileData.length);

        return res.status(200).send(fileData);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch cat picture.' });
    }
}

export async function fetchAllCatPics(req: Request, res: Response) {
    try {
        const files = await fs.promises.readdir(UPLOADS_DIR);
        const result = files.map((file) => {
            return { imageId: file.split(".")[0] }
        });
        return res.status(200).send(result);
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch cat pictures.' });
    }
}
