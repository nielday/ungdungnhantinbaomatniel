// Helper function to normalize file URLs and route them through the backend proxy

export const normalizeFileUrlHelper = (fileUrl: string | undefined | null): string => {
    if (!fileUrl) return '';

    // Prevent double wrapping
    if (fileUrl.includes('/files/proxy?fileUrl=')) {
        return fileUrl;
    }

    // If it's a Backblaze B2 URL, use the presigned URL proxy
    if (fileUrl.includes('backblazeb2.com') || fileUrl.includes('backblaze.com')) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://ungdungnhantinbaomatniel-production.up.railway.app/api';
        return `${apiUrl}/files/proxy?fileUrl=${encodeURIComponent(fileUrl)}`;
    }

    if (fileUrl.startsWith('http')) {
        if (fileUrl.includes('railway.app/uploads/')) {
            const uploadsPath = fileUrl.split('/uploads/')[1];
            return `/uploads/${uploadsPath}`;
        }
        return fileUrl;
    }

    return fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`;
};
