// Cloudflare Images upload utility
export async function uploadToCloudflareImages(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload image');
    }
    
    const data = await response.json();
    return data.url;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export function createImageVariantUrl(imageId: string, variant: string = 'public'): string {
  const accountHash = process.env.NEXT_PUBLIC_CLOUDFLARE_ACCOUNT_HASH;
  return `https://imagedelivery.net/${accountHash}/${imageId}/${variant}`;
}