import Database from '../database';
import { 
  UserProfile, 
  ClassInfo, 
  AttendanceSession, 
  AttendanceRecord, 
  AttendanceStatistics,
  CreateAttendanceSessionRequest,
  MarkAttendanceRequest,
  AttendanceReportRequest,
  PaginatedResponse 
} from '@shared/api';

class AttendanceService {
  private db: Database;

  constructor() {
    this.db = Database.getInstance();
  }

  // User Management
  async getUserById(id: string): Promise<UserProfile | null> {
    const result = await this.db.query<UserProfile>(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    return result.rows[0] || null;
  }

  async getUserByEmail(email: string): Promise<UserProfile | null> {
    const result = await this.db.query<UserProfile>(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    return result.rows[0] || null;
  }

  // Class Management
  async getClassesForUser(userId: string, role: 'student' | 'faculty'): Promise<ClassInfo[]> {
    let query: string;
    let params: any[];

    if (role === 'faculty') {
      query = `
        SELECT 
          c.*,
          co.name as course_name,
          co.code as course_code,
          u.name as instructor_name
        FROM classes c
        JOIN courses co ON c.course_id = co.id
        JOIN users u ON c.instructor_id = u.id
        WHERE c.instructor_id = $1 AND c.is_active = true
        ORDER BY co.code, c.section
      `;
      params = [userId];
    } else {
      query = `
        SELECT 
          c.*,
          co.name as course_name,
          co.code as course_code,
          u.name as instructor_name
        FROM classes c
        JOIN courses co ON c.course_id = co.id
        JOIN users u ON c.instructor_id = u.id
        JOIN class_enrollments ce ON c.id = ce.class_id
        WHERE ce.student_id = $1 AND ce.status = 'active' AND c.is_active = true
        ORDER BY co.code, c.section
      `;
      params = [userId];
    }

    const result = await this.db.query<ClassInfo>(query, params);
    return result.rows;
  }

  // Attendance Session Management
  async createAttendanceSession(
    instructorId: string,
    sessionData: CreateAttendanceSessionRequest
  ): Promise<AttendanceSession> {
    // Generate unique session ID and nonce
    const sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 15)}`;
    const nonce = Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date();
    const [hours, minutes] = sessionData.endTime.split(':').map(Number);
    expiresAt.setHours(hours, minutes, 0, 0);

    const query = `
      INSERT INTO attendance_sessions (
        session_id, class_id, instructor_id, date, start_time, end_time,
        location, mode, expires_at, nonce, location_required, 
        liveness_check_required, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      sessionId,
      sessionData.classId,
      instructorId,
      sessionData.date,
      sessionData.startTime,
      sessionData.endTime,
      sessionData.location || null,
      sessionData.mode,
      expiresAt.toISOString(),
      nonce,
      sessionData.locationRequired || false,
      sessionData.livenessCheckRequired || false,
      sessionData.notes || null,
    ];

    const result = await this.db.query<AttendanceSession>(query, values);
    return result.rows[0];
  }

  async getActiveAttendanceSessions(instructorId?: string): Promise<AttendanceSession[]> {
    let query = `
      SELECT 
        ases.*,
        co.name as class_name,
        co.code as course_code,
        u.name as instructor_name
      FROM attendance_sessions ases
      JOIN classes c ON ases.class_id = c.id
      JOIN courses co ON c.course_id = co.id
      JOIN users u ON ases.instructor_id = u.id
      WHERE ases.status = 'active' AND ases.expires_at > CURRENT_TIMESTAMP
    `;

    const params: any[] = [];
    if (instructorId) {
      query += ' AND ases.instructor_id = $1';
      params.push(instructorId);
    }

    query += ' ORDER BY ases.expires_at';

    const result = await this.db.query<AttendanceSession>(query, params);
    return result.rows;
  }

  // Attendance Record Management
  async markAttendance(
    studentId: string,
    attendanceData: MarkAttendanceRequest,
    markedBy?: string
  ): Promise<AttendanceRecord> {
    // Get session by session_id
    const sessionResult = await this.db.query(
      'SELECT * FROM attendance_sessions WHERE session_id = $1',
      [attendanceData.sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw new Error('Attendance session not found');
    }

    const session = sessionResult.rows[0];
    if (session.status !== 'active' || new Date(session.expires_at) < new Date()) {
      throw new Error('Attendance session is not active or has expired');
    }

    const query = `
      INSERT INTO attendance_records (
        session_id, student_id, status, marked_by, location_verified, 
        liveness_verified, latitude, longitude, location_accuracy, 
        device_info, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (session_id, student_id) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        marked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      session.id,
      studentId,
      attendanceData.status,
      markedBy || null,
      attendanceData.latitude != null,
      true, // Assume liveness verified for now
      attendanceData.latitude || null,
      attendanceData.longitude || null,
      attendanceData.locationAccuracy || null,
      attendanceData.deviceInfo ? JSON.stringify(attendanceData.deviceInfo) : null,
      attendanceData.notes || null,
    ];

    const result = await this.db.query<AttendanceRecord>(query, values);
    return result.rows[0];
  }
}

export default AttendanceService;
