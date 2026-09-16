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
    // Basic Auth credentials - using placeholders per user's request
    // We base64 encode them for the Authorization header
    const authString = btoa(`admin:YOUR_NVR_PASSWORD_HERE`);
    
    // Construct the ISAPI XML search request
    // The Hikvision API expects time in format like 2026-09-15T10:00:00Z
    const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<CMSearchDescription version="2.0" xmlns="http://www.isapi.org/ver20/XMLSchema">
    <searchID>${crypto.randomUUID().toUpperCase()}</searchID>
    <trackIDList>
        <trackID>${trackID}</trackID>
    </trackIDList>
    <timeSpanList>
        <timeSpan>
            <startTime>${startTime.toISOString()}</startTime>
            <endTime>${endTime.toISOString()}</endTime>
        </timeSpan>
    </timeSpanList>
    <maxResults>200</maxResults>
    <searchResultPostion>0</searchResultPostion>
</CMSearchDescription>`;

    const res = await fetch('/api/nvr/ISAPI/ContentMgmt/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${authString}`
      },
      body: xmlPayload
    });

    if (!res.ok) {
      console.warn(`[NVR API] Search failed with status ${res.status}`);
      return [];
    }

    const xmlResponseText = await res.text();
    
    // Parse the XML response natively using DOMParser
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlResponseText, 'application/xml');
    
    const recordings: RecordingItem[] = [];
    
    // Search elements <searchMatchItem>
    const matchItems = xmlDoc.getElementsByTagName('searchMatchItem');
    
    for (let i = 0; i < matchItems.length; i++) {
      const item = matchItems[i];
      const timeSpan = item.getElementsByTagName('timeSpan')[0];
      if (timeSpan) {
        const itemStart = timeSpan.getElementsByTagName('startTime')[0]?.textContent;
        const itemEnd = timeSpan.getElementsByTagName('endTime')[0]?.textContent;
        
        if (itemStart && itemEnd) {
          recordings.push({
            _id: `nvr-${trackID}-${itemStart}`,
            cameraPath: `nvr_${trackID}`,
            startTime: itemStart,
            endTime: itemEnd,
            // For NVR recordings, we will build the RTSP playback URL dynamically in the viewer
            videoPath: '', 
          });
        }
      }
    }
    
    // Sort descending by time (latest first) to match OmniRecord expectations
    recordings.sort((a, b) => new Date(b.startTime || 0).getTime() - new Date(a.startTime || 0).getTime());
    
    return recordings;
  } catch (err) {
    console.error('[NVR API] Failed to fetch NVR recordings:', err);
    return [];
  }
};
