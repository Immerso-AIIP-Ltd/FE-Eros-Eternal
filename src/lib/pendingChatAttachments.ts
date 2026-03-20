/**
 * Bridge for passing attachments from Header chat widget to AiChat page.
 * Files stay in memory during SPA navigation.
 */
export interface PendingVoice {
  url: string;
  file: File;
  duration?: number;
}

let pending: {
  files: File[];
  imageUrls: string[];
  voices: PendingVoice[];
} = { files: [], imageUrls: [], voices: [] };

export function setPendingAttachments(data: {
  files?: File[];
  imageUrls?: string[];
  voices?: PendingVoice[];
}) {
  if (data.files) pending.files = data.files;
  if (data.imageUrls) pending.imageUrls = data.imageUrls;
  if (data.voices) pending.voices = data.voices;
}

export function getAndClearPendingAttachments(): {
  files: File[];
  imageUrls: string[];
  voices: PendingVoice[];
} {
  const result = { ...pending };
  pending = { files: [], imageUrls: [], voices: [] };
  return result;
}

export function hasPendingAttachments(): boolean {
  return (
    pending.files.length > 0 ||
    pending.imageUrls.length > 0 ||
    pending.voices.length > 0
  );
}
