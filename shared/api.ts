/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

export type UserRole = "student" | "faculty";

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface ClassMeta {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
}

export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceRecord {
  id: string;
  classId: string;
  studentId: string;
  timestamp: number;
  status: AttendanceStatus;
  locationOk: boolean;
  livenessOk: boolean;
}

export interface SessionInfo {
  sessionId: string;
  classId: string;
  issuedAt: number;
  exp: number; // expiry ms
  nonce: string;
  mode: "offline" | "online";
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}
