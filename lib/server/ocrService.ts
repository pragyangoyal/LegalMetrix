import fs from 'fs';
import path from 'path';

export interface ServerOcrOutput {
  text: string;
  confidence: number;
  processingTimeMs: number;
}

/**
 * Perform server-side OCR on an image file using Tesseract.js.
 * Uses explicit workerPath to guarantee compatibility with Next.js server runtime.
 */
export async function performServerOcr(imagePathOrBuffer: string | Buffer): Promise<ServerOcrOutput> {
  const start = Date.now();

  try {
    let imageBuffer: Buffer;
    if (typeof imagePathOrBuffer === 'string') {
      if (!fs.existsSync(imagePathOrBuffer)) {
        throw new Error(`File not found: ${imagePathOrBuffer}`);
      }
      imageBuffer = fs.readFileSync(imagePathOrBuffer);
    } else {
      imageBuffer = imagePathOrBuffer;
    }

    // Preprocess image with sharp: auto-orient, convert AVIF/WEBP/HEIC/JPG to standard PNG
    let normalizedInput: Buffer = imageBuffer;
    try {
      const sharp = (await import('sharp')).default;
      normalizedInput = await sharp(imageBuffer)
        .rotate() // Auto-orient based on camera EXIF
        .toFormat('png')
        .toBuffer();
    } catch (sharpErr) {
      console.warn('Sharp format conversion fallback to raw buffer:', sharpErr);
      normalizedInput = imageBuffer;
    }

    const Tesseract = await import('tesseract.js');
    let workerPath: string | undefined;
    try {
      workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
      if (!fs.existsSync(workerPath)) {
        workerPath = undefined;
      }
    } catch {
      workerPath = undefined;
    }

    const workerOptions: Record<string, any> = {
      errorHandler: () => {},
    };
    if (workerPath) {
      workerOptions.workerPath = workerPath;
    }

    const worker = await Tesseract.createWorker('eng', 1, workerOptions);

    // Timeout protection after 30 seconds
    const ocrPromise = worker.recognize(normalizedInput);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('OCR Timeout after 30s')), 30000)
    );

    const ret = await Promise.race([ocrPromise, timeoutPromise]);
    await worker.terminate().catch(() => {});

    const text = ret.data.text || '';
    const confidence = (ret.data.confidence || 0) / 100;
    const processingTimeMs = Date.now() - start;

    return {
      text,
      confidence,
      processingTimeMs,
    };
  } catch (error) {
    console.error('Server OCR error:', error);
    const processingTimeMs = Date.now() - start;
    return {
      text: '',
      confidence: 0,
      processingTimeMs,
    };
  }
}
