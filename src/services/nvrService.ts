import type { RecordingItem } from '../types/camera';

/**
 * Searches for recording segments on a Hikvision NVR for a specific camera (trackID).
 * It uses the ISAPI XML ContentMgmt search endpoint.
 */
// Helper to format Date into local time string like YYYY-MM-DDTHH:mm:ssZ for Hikvision
const formatHikTime = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}Z`;
};

export const fetchNvrRecordings = async (
  trackID: string,
  startTime: Date,
  endTime: Date
): Promise<RecordingItem[]> => {
  try {
    // Pad trackID for NVR (e.g. 1 -> 101)
    const paddedTrackID = trackID.length < 3 ? `${trackID}01` : trackID;
    
    // Construct the ISAPI XML search request for 24/7 continuous recordings using local time strings
    const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
<CMSearchDescription>
  <searchID>${crypto.randomUUID().toUpperCase()}</searchID>
  <trackList><trackID>${paddedTrackID}</trackID></trackList>
  <timeSpanList>
    <timeSpan>
      <startTime>${formatHikTime(startTime)}</startTime>
      <endTime>${formatHikTime(endTime)}</endTime>
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
          // NVR returns local time but appends 'Z'. Strip 'Z' so JS Date parses it as local time.
          rawChunks.push({
            start: new Date(itemStart.replace('Z', '')),
            end: new Date(itemEnd.replace('Z', ''))
          });
        }
      }
    }
    
    if (rawChunks.length === 0) return [];

    // Map raw chunks directly without merging so that the UI can group them into their actual hours properly
    const recordings: RecordingItem[] = rawChunks.map(chunk => ({
      _id: `nvr-${paddedTrackID}-${chunk.start.toISOString()}`,
      cameraPath: `nvr_${paddedTrackID}`,
      startTime: chunk.start.toISOString(),
      endTime: chunk.end.toISOString(),
      videoPath: '', 
      duration: Math.round((chunk.end.getTime() - chunk.start.getTime()) / 1000),
      thumbnailUrl: `/api/nvr/ISAPI/Streaming/channels/${paddedTrackID}/picture`
    }));
    
    // Sort descending by time (latest first) to match OmniRecord expectations
    recordings.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    
    return recordings;
  } catch (err) {
    console.error('[NVR API] Failed to fetch NVR recordings:', err);
    return [];
  }
};
