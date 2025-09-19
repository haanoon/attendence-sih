# Database Schema Documentation

This directory contains the PostgreSQL database schema and related files for the Attendance Management System.

## Files Overview

- **`schema.sql`** - Complete database schema with tables, indexes, triggers, and views
- **`seed.sql`** - Sample data for development and testing
- **`init.sh`** - Database initialization script
- **`README.md`** - This documentation file

## Database Schema Design

### Core Entities

#### 1. Users Table
Stores both students and faculty in a single table with role-based differentiation.
- **Primary Key**: UUID
- **Unique Fields**: email, student_id, employee_id
- **Key Features**: Role-based access, soft deletion support

#### 2. Classes Management
- **Departments**: Academic departments
- **Courses**: Course definitions (CS101, DS201, etc.)
- **Classes**: Specific class instances/sections
- **Class Schedules**: Recurring schedule information

#### 3. Enrollment System
- **Class Enrollments**: Student-class relationships
- **Features**: Enrollment status tracking, grade management

#### 4. Attendance System
- **Attendance Sessions**: Faculty-created attendance sessions
- **Attendance Records**: Individual student attendance entries
- **Features**: QR code support, location verification, liveness checks

### Key Design Features

#### Performance Optimizations
- **Indexes**: Strategic indexes on frequently queried columns
- **Materialized View**: Pre-computed attendance statistics
- **Partitioning Ready**: Schema designed for future partitioning by semester

#### Security Features
- **UUID Primary Keys**: Prevents ID enumeration attacks
- **Audit Trail**: Comprehensive timestamp tracking
- **Data Integrity**: Foreign key constraints and check constraints

#### Scalability Features
- **JSON Support**: Device info stored as JSONB
- **Location Data**: Precise latitude/longitude storage
- **Session Management**: Efficient session handling with nonces

## Database Relationships

```
Users (Students/Faculty)
├── Classes (as instructors)
├── Class Enrollments (as students)
├── Attendance Sessions (as instructors)
└── Attendance Records (as students/markers)

Departments
└── Courses
    └── Classes
        ├── Class Schedules
        ├── Class Enrollments
        └── Attendance Sessions
            └── Attendance Records
```

## Quick Start

### 1. Prerequisites
- PostgreSQL 12+ installed and running
- Database user with CREATE DATABASE privileges

### 2. Environment Variables
```bash
export DATABASE_NAME="attendance_db"
export DATABASE_USER="postgres"
export DATABASE_PASSWORD="your_password"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"
```

### 3. Initialize Database
```bash
# Make script executable
chmod +x database/init.sh

# Run initialization
./database/init.sh
```

### 4. Manual Setup (Alternative)
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create database
CREATE DATABASE attendance_db;

-- Connect to the database
\c attendance_db

-- Apply schema
\i database/schema.sql

-- Load sample data (optional)
\i database/seed.sql
```

## Sample Data

The seed data includes:
- **5 Departments**: CSE, IT, ECE, ME, MBA
- **5 Faculty Members**: Including demo faculty account
- **6 Students**: Including demo student account
- **4 Courses**: CS101, DS201, WEB301, DB401
- **4 Classes**: With different sections and schedules
- **Class Schedules**: Monday-Friday schedules
- **Sample Enrollments**: Students enrolled in multiple classes
- **Sample Session**: One completed attendance session with records

## Query Examples

### Get Student Attendance Statistics
```sql
SELECT 
    u.name as student_name,
    c.name as course_name,
    stat.attendance_percentage,
    stat.present_count,
    stat.late_count,
    stat.absent_count
FROM attendance_statistics stat
JOIN users u ON stat.student_id = u.id
JOIN classes cls ON stat.class_id = cls.id
JOIN courses c ON cls.course_id = c.id
WHERE u.role = 'student'
ORDER BY stat.attendance_percentage DESC;
```

### Get Today's Classes for Faculty
```sql
SELECT 
    c.name as course_name,
    cls.section,
    cs.start_time,
    cs.end_time,
    cs.location,
    cs.mode
FROM classes cls
JOIN courses c ON cls.course_id = c.id
JOIN class_schedules cs ON cls.id = cs.class_id
JOIN users u ON cls.instructor_id = u.id
WHERE u.email = 'sarah.johnson@university.edu'
  AND cs.day_of_week = EXTRACT(DOW FROM CURRENT_DATE)
  AND cls.is_active = true
ORDER BY cs.start_time;
```

### Get Active Attendance Sessions
```sql
SELECT 
    ases.session_id,
    c.name as course_name,
    cls.section,
    ases.date,
    ases.start_time,
    ases.end_time,
    ases.location,
    ases.mode,
    ases.total_enrolled_students,
    ases.total_present,
    ases.total_absent,
    ases.total_late
FROM attendance_sessions ases
JOIN classes cls ON ases.class_id = cls.id
JOIN courses c ON cls.course_id = c.id
WHERE ases.status = 'active'
  AND ases.expires_at > CURRENT_TIMESTAMP
ORDER BY ases.expires_at;
```

## Database Maintenance

### Refresh Statistics
```sql
-- Refresh attendance statistics materialized view
SELECT refresh_attendance_statistics();
```

### Clean Old Sessions
```sql
-- Clean up expired sessions (older than 7 days)
DELETE FROM attendance_sessions 
WHERE status = 'active' 
  AND expires_at < CURRENT_TIMESTAMP - INTERVAL '7 days';
```

### Performance Monitoring
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

## Integration Notes

### TypeScript Integration
The database schema is designed to work with the existing TypeScript interfaces in `shared/api.ts`. Some interfaces may need updates to reflect the full database capabilities.

### API Endpoints
Consider creating these API endpoints:
- `GET /api/classes` - List classes for user
- `GET /api/sessions/:classId` - Get active sessions
- `POST /api/sessions` - Create new session
- `POST /api/attendance` - Mark attendance
- `GET /api/statistics` - Get attendance statistics

### Future Enhancements
- **Real-time Updates**: WebSocket integration for live attendance
- **Mobile App**: API endpoints for mobile attendance
- **Analytics**: Advanced reporting and analytics features
- **Integration**: LMS integration capabilities