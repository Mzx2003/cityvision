export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Detection {
  id: number;
  time: string;
  class: string;
  confidence: number;
  lane: string;
  speed: number;
  violationType: string;
  box: DetectionBox;
}

export interface Settings {
  enableSpeedViolation: boolean;
  enableLaneViolation: boolean;
}
