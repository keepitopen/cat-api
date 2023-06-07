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

        return res.status(200).json({ message: 'Successfully upload picture', data: { id: imageId } });
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
                .json({
                    error: `Cat picture with id: '${imageId}' not found.`
                });
        }

        const filePath = path.join(UPLOADS_DIR, matchingFiles[0]);
        await fs.promises.unlink(filePath);

        res.status(200).json({
            message: `Cat picture with id: '${imageId}' deleted`
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
                .json({
                    error: `Cat picture with id: '${imageId}' not found.`,
                });
        }

        const filePath = path.join(UPLOADS_DIR, matchingFiles[0]);

        await fs.promises.unlink(filePath);

        await new Promise((resolve, reject) => {
            fs.promises
                .rename(tmpPath, destinationPath)
                .then(() => resolve({ id: imageId }))
                .catch((error) => {
                    console.error('Error moving the file:', error);
                    reject(error);
                });
        });

        return res.status(200).json({ message: 'Successfully updated picture.', data: {id: imageId} });
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
                .json({ error: `Cat picture with id: '${imageId}' not found.` });
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
            return { id: file.split(".")[0] }
        });
        return res.status(200).json({ message: 'Successfully fetched list of cat picture IDs', data: result});
    } catch (error) {
        return res.status(500).json({ error: 'Failed to fetch cat pictures.' });
    }
}
