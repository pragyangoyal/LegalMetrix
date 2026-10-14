import { NextRequest, NextResponse } from 'next/server';
import { getInspectionDetail, addInspectionImage } from '@/lib/server/inspectionService';
import { saveUploadedFile } from '@/lib/server/storageService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const inspection = getInspectionDetail(id);
    if (!inspection) {
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 });
    }

    const formData = await request.formData();
    const files: File[] = [];

    // Form data can have multiple files under "images" or "files" or indexed keys
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        files.push(value);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No image files provided' }, { status: 400 });
    }

    if (files.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 images allowed per inspection' }, { status: 400 });
    }

    const labelsRaw = formData.get('labels')?.toString();
    const labels = labelsRaw ? JSON.parse(labelsRaw) : [];

    const uploadedRecords = [];
    const currentCount = inspection.images.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const order = currentCount + i + 1;
      const label = labels[i] || `Image ${order}`;

      const stored = await saveUploadedFile(id, file, order, label);
      const record = addInspectionImage(id, {
        id: stored.id,
        filename: stored.filename,
        originalName: stored.originalName,
        mimeType: stored.mimeType,
        sizeBytes: stored.sizeBytes,
        filePath: stored.filePath,
        imageOrder: order,
        label,
      });

      uploadedRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      count: uploadedRecords.length,
      images: uploadedRecords,
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('Error uploading inspection images:', error);
    return NextResponse.json({ error: 'Failed to upload inspection images' }, { status: 500 });
  }
}
