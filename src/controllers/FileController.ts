import * as koa from 'koa';
import * as uuid from 'uuid';
import { httpPost, httpGet } from "../decorators/HttpRoutes";
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
export default class FileController {
    @httpPost("/upload")
    async upload(ctx: koa.Context) {
        let filename = uuid.v4();
        const file = (ctx.request as any).files.file ;
        
        const ext = file.name.split('.').pop();
        filename = filename+'.'+ext ;
        if (!fs.existsSync('upload')) {
            mkdirp.sync('upload/images');
            mkdirp.sync('upload/videos');
            mkdirp.sync('upload/pdfs');
            mkdirp.sync('upload/others');
        }
        let filePath = "";
        try {
            const FileType = require('file-type');
            const fileType = await FileType.fromStream(fs.createReadStream(file.path));

            if (fileType.mime.includes('image')) {
                filePath = `/images/${filename}`;
            } else if (fileType.mime.includes('video')) {
                filePath = `/videos/${filename}`;
            } else if (fileType.mime.includes('pdf')) {
                filePath = `/pdfs/${filename}`;
            } else {
                filePath = `/others/${filename}`;
            }
            const readStream = fs.createReadStream(file.path);
            const writeStream = fs.createWriteStream(`upload${filePath}`);
            readStream.pipe(writeStream);
            ctx.rest({
                filePath: `file${filePath}`,
                code: 'upload success'
            })
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    @httpGet('/file/:fileType/:filename')
    async getFile(ctx: koa.Context) {
        const { fileType, filename } = ctx.params;
        const readStream = fs.createReadStream(`upload/${fileType}/${filename}`);
        ctx.body = readStream;
    }
}