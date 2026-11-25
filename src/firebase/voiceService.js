import * as FileSystem from 'expo-file-system/legacy';

const WORKER_URL =
  'https://fast-spend-gemini.popovalex425.workers.dev/';

export const transcribeVoice = async (audioUri) => {
  try {
    const audioBase64 = await FileSystem.readAsStringAsync(
      audioUri,
      { encoding: FileSystem.EncodingType.Base64 }
    );

    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mode: 'voice',
        audioBase64,
        audioMimeType: 'audio/mp4',
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Voice transcription failed');
    }

    return result;

  } catch (error) {
    console.error('Voice transcription error:', error);
    throw error;
  }
};
