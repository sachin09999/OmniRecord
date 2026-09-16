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
    const authString = btoa(`admin:16@SnV?cR1`);
    
    // Construct the ISAPI JSON search request
    const jsonPayload = {
      SearchDescription: {
        searchID: crypto.randomUUID().toUpperCase(),
        searchResultPosition: 0,
        maxResults: 200,
        SearchCondList: [
          {
            channelID: parseInt(trackID, 10),
            // Including "human" and "vehicle" as per the user's example, although omitting it might fetch everything.
            // Let's use the exact format requested.
            targetTypes: ["human", "vehicle"],
            searchTimeList: [
              {
                searchTime: {
                  startTime: startTime.toISOString(),
                  endTime: endTime.toISOString()
                }
              }
            ]
          }
        ]
      }
    };

    // Note: The endpoint changes from /search to /SearchByTargetType?format=json
    const res = await fetch('/api/nvr/ISAPI/ContentMgmt/SearchByTargetType?format=json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify(jsonPayload)
    });

    if (!res.ok) {
      console.warn(`[NVR API] Search failed with status ${res.status}`);
      return [];
    }

    const data = await res.json();
    const recordings: RecordingItem[] = [];
    const matchList = data.SearchResult?.matchList || [];

    for (const match of matchList) {
      const recordInfos = match.RecordInfoList || [];
      for (const info of recordInfos) {
        const itemStart = info.RecordTime?.startTime;
        const itemEnd = info.RecordTime?.endTime;
        
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
