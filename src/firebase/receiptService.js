import * as FileSystem from 'expo-file-system/legacy';

const WORKER_URL = 'https://fast-spend-gemini.popovalex425.workers.dev/';

export const scanReceipt = async (imageUri, categories) => {
  try {
    const imageBase64 = await FileSystem.readAsStringAsync(
      imageUri,
      {
        encoding: FileSystem.EncodingType.Base64,
      }
    );

    const extension = imageUri.split('.').pop()?.toLowerCase();

    const mimeType =
      extension === 'png'
        ? 'image/png'
        : extension === 'webp'
          ? 'image/webp'
          : 'image/jpeg';

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageBase64,
        mimeType,
        categories,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Receipt scanning failed');
    }

    return result;

  } catch (error) {
    console.error('Receipt scanning error:', error);
    throw error;
  }
};
