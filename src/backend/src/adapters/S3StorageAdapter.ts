import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"; // Não te esqueças de instalar isto!

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "eu-west-3",
});

export class S3StorageAdapter {
  private bucketName = process.env.S3_BUCKET_NAME || "hotel-animais-bucket";

  async uploadFicheiro(nomeFicheiro: string, ficheiroBuffer: Buffer, tipoMime: string, pasta: 'animais' | 'documentos' | 'diario'): Promise<string> {
    const nomeLimpo = nomeFicheiro.replace(/\s+/g, '-');
    const chaveS3 = `${pasta}/${Date.now()}-${nomeLimpo}`;

    const command = new PutObjectCommand({
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
  async gerarLinkTemporario(chaveS3: string): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: chaveS3,
    });

    // 900 segundos = 15 minutos
    return await getSignedUrl(s3Client, command, { expiresIn: 900 });
  }
}