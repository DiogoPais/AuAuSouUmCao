"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3StorageAdapter = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner"); // Não te esqueças de instalar isto!
const s3Client = new client_s3_1.S3Client({
    region: process.env.AWS_REGION || "eu-west-3",
});
class S3StorageAdapter {
    bucketName = process.env.S3_BUCKET_NAME || "hotel-animais-bucket";
    async uploadFicheiro(nomeFicheiro, ficheiroBuffer, tipoMime, pasta) {
        const nomeLimpo = nomeFicheiro.replace(/\s+/g, '-');
        const chaveS3 = `${pasta}/${Date.now()}-${nomeLimpo}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: this.bucketName,
            Key: chaveS3,
            Body: ficheiroBuffer,
            ContentType: tipoMime,
        });
        await s3Client.send(command);
        // Se for foto de animal, devolve o link completo (público)
        // Se for documento, devolve só a Key interna (privado)
        return (pasta === 'animais' || pasta === 'diario')
            ? `https://${this.bucketName}.s3.${process.env.AWS_REGION || "eu-west-3"}.amazonaws.com/${chaveS3}`
            : chaveS3;
    }
    // Gera o "Passe VIP" de 15 minutos para os PDFs
    async gerarLinkTemporario(chaveS3) {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: this.bucketName,
            Key: chaveS3,
        });
        // 900 segundos = 15 minutos
        return await (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, { expiresIn: 900 });
    }
}
exports.S3StorageAdapter = S3StorageAdapter;
