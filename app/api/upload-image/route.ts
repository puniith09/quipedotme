import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return Response.json({ error: 'No file provided' }, { status: 400 });
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      return Response.json({ error: 'File must be an image' }, { status: 400 });
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return Response.json({ error: 'File size must be less than 10MB' }, { status: 400 });
    }
    
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_IMAGES_API_TOKEN}`,
        },
        body: uploadFormData,
      }
    );
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Cloudflare API error:', errorData);
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }
    
    const data = await response.json();
    
    if (!data.success) {
      console.error('Cloudflare upload failed:', data);
      return Response.json({ error: 'Upload failed' }, { status: 500 });
    }
    
    return Response.json({
      url: data.result.variants[0], // Use the first variant URL
      imageId: data.result.id,
    });
    
  } catch (error) {
    console.error('Error uploading to Cloudflare Images:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}