import type { Detection } from "../types";

const SAMPLE_VIDEO_URL = "https://www.w3schools.com/html/mov_bbb.mp4";

export default function VideoDetectionPlayer({ detections }: { detections: Detection[] }) {
  const overlayDetections = detections.slice(0, 4);

  return (
    <div className="video-card card">
      <h3>Live Camera Feed (Demo)</h3>
      <div className="video-wrap">
        <video src={SAMPLE_VIDEO_URL} controls muted autoPlay loop />
        <div className="overlay">
          {overlayDetections.map((detection) => (
            <div
              key={detection.id}
              className="bbox"
              style={{
                left: `${detection.box.x}%`,
                top: `${detection.box.y}%`,
                width: `${detection.box.width}%`,
                height: `${detection.box.height}%`
              }}
              title={`${detection.class} (${Math.round(detection.confidence * 100)}%)`}
            >
              <span>
                {detection.class} • {Math.round(detection.confidence * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
