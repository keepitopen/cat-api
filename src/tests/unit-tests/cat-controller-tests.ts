import sinon from 'sinon';
import { expect } from 'chai';

import path from 'path';
import fs from 'fs';
import { Dirent } from 'fs';

import { UPLOADS_DIR } from '../../app/config/constants';

import {
    uploadCatPic,
    fetchAllCatPics,
    fetchCatPicById,
    updateCatPic,
    deleteCatPic,
} from '../../app/controllers/catController';

describe('fetchAllCatPics', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should fetch all cat pictures successfully', async () => {
        const files: any = ['cat-pic-1.jpg', 'cat-pic-2.jpg'];

        const readdirStub = sinon.stub(fs.promises, 'readdir').resolves(files);

        const req: any = {};
        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        await fetchAllCatPics(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        
        const expectedResponse = files.map((id:any) => ({ id:id.split(".")[0] }));
        expect(res.json.args[0][0]).to.deep.equal({ message: 'Successfully fetched list of cat picture IDs', data: expectedResponse});

        readdirStub.restore();
    });

    it('should handle error in fetching cat pictures', async () => {
        const readdirStub = sinon
            .stub(fs.promises, 'readdir')
            .rejects(new Error('Failed to fetch cat pictures'));

        const req: any = {};
        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        await fetchAllCatPics(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(res.status.calledWith(500)).to.be.true;
        expect(res.json.calledWith({ error: 'Failed to fetch cat pictures.' }))
            .to.be.true;

        readdirStub.restore();
    });
});

describe('fetchCatPicById', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should fetch the cat picture by ID', async () => {
        const imageId = 'cat-pic-1';
        const matchingFile = 'cat-pic-1.jpg';

        const req: any = {
            params: {
                id: imageId,
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
            setHeader: sinon.spy(),
        };

        const readdirStub = sinon
            .stub(fs.promises, 'readdir')
            .resolves([matchingFile] as unknown as Dirent[]);
        const readFileStub = sinon
            .stub(fs.promises, 'readFile')
            .resolves(Buffer.from('image data'));

        await fetchCatPicById(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(
            readFileStub.calledOnceWith(path.join(UPLOADS_DIR, matchingFile))
        ).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledOnce).to.be.true;
        expect(res.setHeader.calledWith('Content-Type', 'image/jpeg')).to.be
            .true;
        expect(res.setHeader.calledWith('Content-Length', 10)).to.be.true;
    });

    it('should return an error if cat picture is not found by ID', async () => {
        const imageId = 'non-existing-id';

        const req: any = {
            params: {
                id: imageId,
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const readdirStub = sinon
            .stub(fs.promises, 'readdir')
            .resolves([
                'cat-pic-1.jpg',
                'cat-pic-2.jpg',
            ] as unknown as Dirent[]);

        await fetchCatPicById(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(res.status.calledWith(400)).to.be.true;
        expect(
            res.json.calledWith({ error: `Cat picture with id: 'non-existing-id' not found.` })
        ).to.be.true;
    });
});

describe('uploadCatPic', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should upload a cat picture successfully', async () => {
        const req: any = {
            file: {
                path: path.join(
                    process.cwd(),
                    '/tmp/cat-pic-1.jpg'
                ),
                filename: 'cat-pic-1.jpg',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const renameStub = sinon.stub(fs.promises, 'rename').resolves();

        await uploadCatPic(req, res);

        expect(
            renameStub.calledOnceWith(
                req.file.path,
                path.join(UPLOADS_DIR, 'cat-pic-1.jpg')
            )
        ).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ message: 'Successfully upload picture', data: { id:'cat-pic-1' } })).to.be.true;

        renameStub.restore();
    });

    it('should handle missing cat picture in the request', async () => {
        const req: any = {};

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        await uploadCatPic(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(
            res.json.calledWith({
                error: 'Missing cat picture in the request.',
            })
        ).to.be.true;
    });
});

describe('updateCatPic', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should update a cat picture', async () => {
        const req: any = {
            params: {
                id: 'cat-pic-1',
            },
            file: {
                path: path.join(
                    process.cwd(),
                    '/tmp/cat-pic-1.jpg'
                ),
                filename: 'cat-pic-1.jpg',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const readdirStub = sinon
            .stub(fs.promises, 'readdir')
            .resolves(['cat-pic-1.jpg'] as unknown as Dirent[]);
        const unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();
        const renameStub = sinon.stub(fs.promises, 'rename').resolves();

        await updateCatPic(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(
            unlinkStub.calledOnceWith(path.join(UPLOADS_DIR, 'cat-pic-1.jpg'))
        ).to.be.true;
        expect(
            renameStub.calledOnceWith(
                req.file.path,
                path.join(UPLOADS_DIR, 'cat-pic-1.jpg')
            )
        ).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(res.json.calledWith({ message: 'Successfully updated picture.', data: { id:'cat-pic-1' } })).to.be.true;
    });

    it('should handle missing cat picture in the request', async () => {
        const req: any = {
            params: {
                id: 'cat-pic-1',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        await updateCatPic(req, res);

        expect(res.status.calledWith(400)).to.be.true;
        expect(
            res.json.calledWith({
                error: 'Missing cat picture in the request.',
            })
        ).to.be.true;
    });

    it('should handle cat picture not found', async () => {
        const req: any = {
            params: {
                id: 'non-existing-id',
            },
            file: {
                path: path.join(
                    process.cwd(),
                    '/tmp/cat-pic-1.jpg'
                ),
                filename: 'cat-pic.jpg',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const readdirStub = sinon.stub(fs.promises, 'readdir').resolves([]);
        const unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();
        const renameStub = sinon.stub(fs.promises, 'rename').resolves();

        await updateCatPic(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(unlinkStub.notCalled).to.be.true;
        expect(renameStub.notCalled).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(
            res.json.calledWith({
                error:
                    "Cat picture with id: 'non-existing-id' not found.",
            })
        ).to.be.true;
    });
});

describe('deleteCatPic', () => {
    beforeEach(() => {
        sinon.restore();
    });

    it('should delete a cat picture', async () => {
        const req: any = {
            params: {
                id: 'cat-pic-1',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const readdirStub = sinon
            .stub(fs.promises, 'readdir')
            .resolves(['cat-pic-1.jpg'] as unknown as Dirent[]);
        const unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();

        await deleteCatPic(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(
            unlinkStub.calledOnceWith(path.join(UPLOADS_DIR, 'cat-pic-1.jpg'))
        ).to.be.true;
        expect(res.status.calledWith(200)).to.be.true;
        expect(
            res.json.calledWith({
                message: "Cat picture with id: 'cat-pic-1' deleted"
            })
        ).to.be.true;
    });

    it('should handle cat picture not found', async () => {
        const req: any = {
            params: {
                id: 'non-existing-id',
            },
        };

        const res: any = {
            status: sinon.stub().returnsThis(),
            json: sinon.spy(),
        };

        const readdirStub = sinon.stub(fs.promises, 'readdir').resolves([]);
        const unlinkStub = sinon.stub(fs.promises, 'unlink').resolves();

        await deleteCatPic(req, res);

        expect(readdirStub.calledOnceWith(UPLOADS_DIR)).to.be.true;
        expect(unlinkStub.notCalled).to.be.true;
        expect(res.status.calledWith(404)).to.be.true;
        expect(
            res.json.calledWith({
                error:
                    "Cat picture with id: 'non-existing-id' not found.",
            })
        ).to.be.true;
    });
});
