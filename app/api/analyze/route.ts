import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    const pythonServiceUrl = process.env.PYTHON_SERVICE_URL || 'http://localhost:8000';

    try {
        const contentType = request.headers.get('content-type') || '';

        if (contentType.includes('multipart/form-data')) {
            const formData = await request.formData();
            const pipeline = formData.get('pipeline') as string || 'quality';
            const file = formData.get('file');

            if (!file) {
                return NextResponse.json({ message: 'No file provided' }, { status: 400 });
            }

            // Forward multipart/form-data to FastAPI
            const pythonFormData = new FormData();
            pythonFormData.append('file', file);

            const pythonPipeline = pipeline === 'quality-check' ? 'quality' : pipeline;
            const targetUrl = `${pythonServiceUrl}/api/analyze/${pythonPipeline}`;

            const response = await fetch(targetUrl, {
                method: 'POST',
                body: pythonFormData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Python service error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return NextResponse.json(data);
        } else {
            // Legacy/fallback JSON format
            const { pipeline, imageData } = await request.json();
            const response = await fetch(`${pythonServiceUrl}/api/analyze/${pipeline}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ imageData }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Python service error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            return NextResponse.json(data);
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ message: errorMessage }, { status: 500 });
    }
}
