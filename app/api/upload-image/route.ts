import { NextRequest, NextResponse } from 'next/server';

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH;

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ACCOUNT_HASH) {
      return NextResponse.json(
        { error: 'Missing Cloudflare configuration' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
    }

    // Prepare form data for Cloudflare
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    // Upload to Cloudflare Images
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        },
        body: uploadFormData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Cloudflare upload error:', result);
      return NextResponse.json(
        { error: 'Upload failed', details: result },
        { status: 500 }
      );
    }

    // Return the image URL using Cloudflare Images delivery URL
    const imageId = result.result.id;
    const imageUrl = `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`;
    
    return NextResponse.json({
      success: true,
      url: imageUrl,
      id: imageId,
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}