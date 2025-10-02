import { pipeline, env } from '@huggingface/transformers';

// Configure transformers to use browser cache
env.allowLocalModels = false;
env.useBrowserCache = true;

let faceDetectionPipeline: any = null;

export const initializeFaceDetection = async () => {
  if (!faceDetectionPipeline) {
    faceDetectionPipeline = await pipeline(
      'image-feature-extraction',
      'Xenova/vit-base-patch16-224',
      { device: 'webgpu' }
    );
  }
  return faceDetectionPipeline;
};

export const extractFaceEmbedding = async (imageElement: HTMLImageElement): Promise<number[]> => {
  const pipeline = await initializeFaceDetection();
  const result = await pipeline(imageElement);
  return Array.from(result.data);
};

export const compareFaces = (embedding1: number[], embedding2: number[]): number => {
  // Calculate cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }
  
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
};

export const loadImage = (file: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
};
