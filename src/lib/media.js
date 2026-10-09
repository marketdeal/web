import { useEffect, useState } from 'react';
import { readImageFile } from './image';
import { uid } from './format';

// Community attachments. Photos are compressed to a small data URL and stored on the post itself
// (see lib/image.js). Videos are far too big for localStorage (~5MB for the whole app), so the file
// is kept in IndexedDB and the post only stores its id. There's no backend in this prototype, so a
// video is only playable in the browser it was uploaded from.

const MAX_VIDEO_BYTES = 50 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 90;
const DB_NAME = 'marketdeal-media';
const STORE = 'videos';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx(mode, run) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const req = run(t.objectStore(STORE));
    t.oncomplete = () => { db.close(); resolve(req?.result); };
    t.onerror = () => { db.close(); reject(t.error); };
    t.onabort = () => { db.close(); reject(t.error || new Error('Storage was full or blocked.')); };
  });
}

const getVideo = (id) => tx('readonly', (s) => s.get(id));
export const deleteVideo = (id) => tx('readwrite', (s) => s.delete(id)).catch(() => {});

/** Reads the clip's length without uploading anything — rejects files the browser can't play. */
function videoDuration(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); resolve(v.duration); };
    v.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This video format isn’t supported on this device.')); };
    v.src = url;
  });
}

async function readVideoFile(file) {
  if (file.size > MAX_VIDEO_BYTES) throw new Error('That video is too large — please keep it under 50MB.');
  const seconds = await videoDuration(file);
  if (Number.isFinite(seconds) && seconds > MAX_VIDEO_SECONDS) {
    throw new Error(`Please keep videos under ${MAX_VIDEO_SECONDS} seconds (this one is ${Math.round(seconds)}s).`);
  }
  const id = uid('vid-');
  try {
    await tx('readwrite', (s) => s.put(file, id));
  } catch {
    throw new Error('Not enough storage on this device to save that video.');
  }
  return { kind: 'video', id, url: URL.createObjectURL(file) };
}

/** A picked file → `{ kind: 'image', src }` or `{ kind: 'video', id, url }` (url is for the preview only). */
export async function readMediaFile(file) {
  if (file.type.startsWith('video/')) return readVideoFile(file);
  if (file.type.startsWith('image/')) return { kind: 'image', src: await readImageFile(file) };
  throw new Error('Please choose a photo or a video.');
}

/** Drop a picked-but-not-posted attachment (frees the stored video and its preview URL). */
export function discardMedia(media) {
  if (media?.kind !== 'video') return;
  URL.revokeObjectURL(media.url);
  deleteVideo(media.id);
}

/** Playable URL for a stored video id: `undefined` while loading, `null` if it isn't on this device. */
export function useVideoUrl(id) {
  const [url, setUrl] = useState(undefined);
  useEffect(() => {
    if (!id) return undefined;
    let objectUrl = null;
    let alive = true;
    setUrl(undefined);
    getVideo(id)
      .then((blob) => {
        if (!alive) return;
        objectUrl = blob ? URL.createObjectURL(blob) : null;
        setUrl(objectUrl);
      })
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return url;
}

/** After posting: the attachment is now owned by the post, so only the preview URL is released. */
export function releasePreview(media) {
  if (media?.kind === 'video') URL.revokeObjectURL(media.url);
}
