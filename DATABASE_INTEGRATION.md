# Attendance Management System - Database Integration

## Overview

This project now includes a comprehensive PostgreSQL database schema for managing student attendance across classes. The system supports both online and offline attendance modes with QR code generation, location verification, and liveness detection.

## Quick Start

### 1. Database Setup

#### Option A: Using Docker (Recommended)
```bash
# Start PostgreSQL with sample data
docker-compose up -d

# The database will be automatically initialized with schema and sample data
# Access Adminer (database admin) at http://localhost:8081
# Server: postgres, User: postgres, Password: postgres, Database: attendance_db
```

#### Option B: Manual PostgreSQL Setup
```bash
# Install PostgreSQL (if not already installed)
# Create database and user manually

# Set environment variables
export DATABASE_NAME="attendance_db"
export DATABASE_USER="postgres" 
export DATABASE_PASSWORD="your_password"
export DATABASE_HOST="localhost"
export DATABASE_PORT="5432"

# Initialize database
chmod +x database/init.sh
./database/init.sh
```

### 2. Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The server will start on http://localhost:8080
# API endpoints are available at http://localhost:8080/api/*
```

### 3. Test Database Connection

```bash
# Check database health
curl http://localhost:8080/api/health

# Expected response:
# {
#   "status": "healthy",
#   "message": "Database connection successful",
#   "timestamp": "2024-..."
# }
```

## Database Schema

### Core Tables

- **users**: Students and faculty with role-based access
- **departments**: Academic departments (CSE, IT, ECE, etc.)
- **courses**: Course definitions (CS101, DS201, etc.)
- **classes**: Specific class instances/sections
- **class_schedules**: Recurring schedule information
- **class_enrollments**: Student-class relationships
- **attendance_sessions**: Faculty-created attendance sessions
- **attendance_records**: Individual student attendance entries

### Key Features

- **UUID Primary Keys**: Enhanced security
- **Audit Trail**: Automatic timestamp tracking
- **Performance Optimized**: Strategic indexes and materialized views
- **Location Tracking**: GPS coordinates with accuracy
- **Device Information**: JSONB storage for device metadata
- **Session Management**: Secure nonce-based sessions

## API Endpoints

### Health Check
```bash
GET /api/health
# Check database connectivity
```

### Class Management
```bash
GET /api/classes?userId={userId}&role={student|faculty}
# Get classes for a user based on their role
```

### Attendance Sessions
```bash
POST /api/sessions?instructorId={instructorId}
Content-Type: application/json
{
  "classId": "uuid",
  "date": "2024-12-19",
  "startTime": "09:00",
  "endTime": "10:30",
  "location": "Room A101",
  "mode": "offline",
  "locationRequired": true,
  "livenessCheckRequired": true
}
# Create new attendance session

GET /api/sessions?instructorId={instructorId}
# Get active sessions for instructor (optional parameter)
```

### Mark Attendance
```bash
POST /api/attendance?studentId={studentId}
Content-Type: application/json
{
  "sessionId": "session-id-from-qr",
  "status": "present",
  "latitude": 40.7128,
  "longitude": -74.0060,
  "locationAccuracy": 10.5,
  "deviceInfo": {
    "userAgent": "...",
    "platform": "..."
  }
}
# Mark student attendance
```

## Sample Data

The system comes with realistic sample data:

### Users
- **Faculty**: 5 instructors including demo account (faculty@university.edu)
- **Students**: 6 students including demo account (student@university.edu)

### Academic Structure  
- **Departments**: CSE, IT, ECE, ME, MBA
- **Courses**: CS101, DS201, WEB301, DB401
- **Classes**: Multiple sections with schedules

### Demo Credentials
- **Student**: student@university.edu / student123
- **Faculty**: faculty@university.edu / faculty123

## Usage Examples

### Faculty Workflow
1. Login as faculty
2. View assigned classes
3. Start attendance session for a class
4. Share QR code with students (offline mode)
5. Monitor attendance in real-time
6. Complete session and view reports

### Student Workflow
1. Login as student  
2. View enrolled classes
3. Scan QR code during class (offline mode)
4. Verify location if required
5. Complete liveness check if required
6. View attendance history

## Database Queries

### Get Student Attendance Statistics
```sql
SELECT 
    u.name as student_name,
    co.name as course_name,
    stat.attendance_percentage,
    stat.present_count,
    stat.total_sessions_held
FROM attendance_statistics stat
JOIN users u ON stat.student_id = u.id
JOIN classes c ON stat.class_id = c.id
JOIN courses co ON c.course_id = co.id
WHERE u.student_id = 'STU2024001';
```

### Get Today's Active Sessions
```sql
SELECT 
    ases.session_id,
    co.name as course_name,
    ases.location,
    ases.expires_at
FROM attendance_sessions ases
JOIN classes c ON ases.class_id = c.id
JOIN courses co ON c.course_id = co.id
WHERE ases.status = 'active' 
  AND DATE(ases.date) = CURRENT_DATE;
```

## Environment Variables

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=attendance_db
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_SSL=false
DATABASE_MAX_CONNECTIONS=20
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify credentials in .env file
   - Check firewall settings

2. **Schema/Seed Errors**
   - Ensure PostgreSQL version 12+
   - Check user has CREATE DATABASE privileges
   - Verify uuid-ossp extension is available

3. **Performance Issues**
   - Run `REFRESH MATERIALIZED VIEW attendance_statistics;`
   - Check query execution plans
   - Consider adjusting connection pool settings

### Development Commands

```bash
# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start

# Database health check
curl http://localhost:8080/api/health
```

## Next Steps

1. **Frontend Integration**: Connect React components to new API endpoints
2. **Real-time Updates**: Add WebSocket support for live attendance
3. **Mobile App**: Create mobile client for easier student access
4. **Analytics**: Advanced reporting and attendance analytics
5. **Notifications**: Email/SMS notifications for low attendance