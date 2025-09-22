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
  studentId?: string;
  employeeId?: string;
  phone?: string;
  profilePictureUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  headOfDepartment?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  description?: string;
  credits: number;
  departmentId?: string;
  createdAt: string;
}

export interface ClassInfo {
  id: string;
  courseId: string;
  instructorId: string;
  section: string;
  semester: string;
  academicYear: string;
  maxStudents: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  courseName?: string;
  courseCode?: string;
  instructorName?: string;
}

export interface ClassSchedule {
  id: string;
  classId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, etc.
  startTime: string; // HH:MM format
  endTime: string;
  location?: string;
  mode: "online" | "offline" | "hybrid";
  createdAt: string;
}

export interface ClassEnrollment {
  id: string;
  classId: string;
  studentId: string;
  enrollmentDate: string;
  status: "active" | "dropped" | "completed" | "withdrawn";
  finalGrade?: string;
  createdAt: string;
}

export type AttendanceStatus = "present" | "late" | "absent";

export interface AttendanceSession {
  id: string;
  sessionId: string; // Used for QR codes
  classId: string;
  instructorId: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  mode: "online" | "offline";
  status: "active" | "completed" | "cancelled";
  issuedAt: string;
  expiresAt: string;
  nonce: string;
  qrRefreshInterval: number; // seconds
  locationRequired: boolean;
  livenessCheckRequired: boolean;
  notes?: string;
  totalEnrolledStudents: number;
  totalPresent: number;
  totalAbsent: number;
  totalLate: number;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  className?: string;
  courseCode?: string;
  instructorName?: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  status: AttendanceStatus;
  markedAt: string;
  markedBy?: string; // Faculty who marked (null for self-marking)
  locationVerified: boolean;
  livenessVerified: boolean;
  ipAddress?: string;
  userAgent?: string;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number; // meters
  deviceInfo?: Record<string, any>;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Joined fields
  studentName?: string;
  sessionInfo?: Pick<AttendanceSession, 'date' | 'startTime' | 'endTime'>;
}

export interface AttendanceStatistics {
  studentId: string;
  classId: string;
  totalSessionsAttended: number;
  totalSessionsHeld: number;
  attendancePercentage: number;
  presentCount: number;
  lateCount: number;
  absentCount: number;
  lastAttendanceDate?: string;
  // Joined fields
  studentName?: string;
  courseName?: string;
  courseCode?: string;
}

// Legacy interfaces for backward compatibility
export interface ClassMeta {
  id: string;
  name: string;
  instructor: string;
  schedule: string;
}

export interface SessionInfo {
  sessionId: string;
  classId: string;
  issuedAt: number;
  exp: number; // expiry ms
  nonce: string;
  mode: "offline" | "online";
}

// API Request/Response types
export interface CreateAttendanceSessionRequest {
  classId: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  mode: "online" | "offline";
  locationRequired?: boolean;
  livenessCheckRequired?: boolean;
  notes?: string;
}

export interface MarkAttendanceRequest {
  sessionId: string;
  status: AttendanceStatus;
  latitude?: number;
  longitude?: number;
  locationAccuracy?: number;
  deviceInfo?: Record<string, any>;
  notes?: string;
}

export interface AttendanceReportRequest {
  classId?: string;
  studentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: AttendanceStatus;
}

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
