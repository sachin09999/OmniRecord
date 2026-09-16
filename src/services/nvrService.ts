import type { RecordingItem } from '../types/camera';

/**
 * Searches for recording segments on a Hikvision NVR for a specific camera (trackID).
 * It uses the ISAPI XML ContentMgmt search endpoint.
 */
export const fetchNvrRecordings = async (
  trackID: string,
  startTime: Date,
  endTime: Date
): Promise<RecordingItem[]> => {
  try {
    // Pad trackID for NVR (e.g. 1 -> 101)
    const paddedTrackID = trackID.length < 3 ? `${trackID}01` : trackID;
    
    // Construct the ISAPI XML search request for 24/7 continuous recordings
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<CMSearchDescription>
  <searchID>${crypto.randomUUID().toUpperCase()}</searchID>
  <trackList><trackID>${paddedTrackID}</trackID></trackList>
  <timeSpanList>
    <timeSpan>
      <startTime>${startTime.toISOString().split('.')[0] + 'Z'}</startTime>
      <endTime>${endTime.toISOString().split('.')[0] + 'Z'}</endTime>
    </timeSpan>
  </timeSpanList>
  <maxResults>100</maxResults>
  <searchResultPosition>0</searchResultPosition>
  <metadataList>
    <metadataDescriptor>//recordType.meta.std-cgi.com</metadataDescriptor>
  </metadataList>
</CMSearchDescription>`;

    const res = await fetch('/api/nvr/ISAPI/ContentMgmt/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlPayload
    });

    if (!res.ok) {
      console.warn(`[NVR API] Search failed with status ${res.status}`);
      return [];
    }

    const xmlText = await res.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'application/xml');
    
    const matchItems = xmlDoc.getElementsByTagName('searchMatchItem');
    const rawChunks: { start: Date; end: Date }[] = [];

    for (let i = 0; i < matchItems.length; i++) {
      const item = matchItems[i];
      const timeSpan = item.getElementsByTagName('timeSpan')[0];
      if (timeSpan) {
        const itemStart = timeSpan.getElementsByTagName('startTime')[0]?.textContent;
        const itemEnd = timeSpan.getElementsByTagName('endTime')[0]?.textContent;
        if (itemStart && itemEnd) {
          rawChunks.push({
            start: new Date(itemStart),
            end: new Date(itemEnd)
          });
        }
      }
    }
    
    if (rawChunks.length === 0) return [];

    // Sort ascending to merge contiguous blocks
    rawChunks.sort((a, b) => a.start.getTime() - b.start.getTime());

    const mergedChunks: { start: Date; end: Date }[] = [rawChunks[0]];
    
    for (let i = 1; i < rawChunks.length; i++) {
      const current = rawChunks[i];
      const lastMerged = mergedChunks[mergedChunks.length - 1];
      
      // If gap is less than 60 seconds, merge them into a single continuous block
      // This prevents the video stream from terminating prematurely when clicking a block
      if (current.start.getTime() - lastMerged.end.getTime() <= 60000) {
        if (current.end.getTime() > lastMerged.end.getTime()) {
          lastMerged.end = current.end;
        }
      } else {
        mergedChunks.push(current);
      }
    }

    const recordings: RecordingItem[] = mergedChunks.map(chunk => ({
      _id: `nvr-${paddedTrackID}-${chunk.start.toISOString()}`,
      cameraPath: `nvr_${paddedTrackID}`,
      startTime: chunk.start.toISOString(),
      endTime: chunk.end.toISOString(),
      videoPath: '', 
    }));
    
    // Sort descending by time (latest first) to match OmniRecord expectations
    recordings.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    
    return recordings;
  } catch (err) {
    console.error('[NVR API] Failed to fetch NVR recordings:', err);
    return [];
  }
};
