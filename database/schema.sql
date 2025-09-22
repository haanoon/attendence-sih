-- PostgreSQL Database Schema for Attendance Management System
-- Optimized schema design for efficient attendance tracking

-- Enable UUID extension for generating unique identifiers
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table - stores both students and faculty
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'faculty')),
    student_id VARCHAR(50) UNIQUE, -- For students: enrollment number, roll number, etc.
    employee_id VARCHAR(50) UNIQUE, -- For faculty: employee ID
    phone VARCHAR(20),
    profile_picture_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    head_of_department UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Courses table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    department_id UUID REFERENCES departments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Classes table - represents specific class instances/sections
CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id),
    instructor_id UUID NOT NULL REFERENCES users(id),
    section VARCHAR(10) NOT NULL, -- e.g., 'A', 'B', '001'
    semester VARCHAR(20) NOT NULL, -- e.g., 'Fall 2024', 'Spring 2025'
    academic_year VARCHAR(10) NOT NULL, -- e.g., '2024-25'
    max_students INTEGER DEFAULT 60,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, section, semester, academic_year)
);

-- Class schedules - recurring schedule information
CREATE TABLE class_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    mode VARCHAR(20) NOT NULL DEFAULT 'offline' CHECK (mode IN ('online', 'offline', 'hybrid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CHECK (end_time > start_time)
);

-- Class enrollments - student-class relationships
CREATE TABLE class_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dropped', 'completed', 'withdrawn')),
    final_grade VARCHAR(5), -- A, B+, B, C+, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(class_id, student_id)
);

-- Attendance sessions - created by faculty for taking attendance
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id VARCHAR(255) UNIQUE NOT NULL, -- Used for QR codes and student reference
    class_id UUID NOT NULL REFERENCES classes(id),
    instructor_id UUID NOT NULL REFERENCES users(id),
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('online', 'offline')),
    
    -- Session management
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    nonce VARCHAR(255) NOT NULL, -- For security
    
    -- QR code settings (for offline mode)
    qr_refresh_interval INTEGER DEFAULT 45, -- seconds
    location_required BOOLEAN DEFAULT FALSE,
    liveness_check_required BOOLEAN DEFAULT FALSE,
    
    -- Session metadata
    notes TEXT,
    total_enrolled_students INTEGER DEFAULT 0,
    total_present INTEGER DEFAULT 0,
    total_absent INTEGER DEFAULT 0,
    total_late INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CHECK (expires_at > issued_at),
    CHECK (end_time > start_time)
);

-- Attendance records - individual student attendance entries
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id),
    
    -- Attendance details
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'late', 'absent')),
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    marked_by UUID REFERENCES users(id), -- Faculty who marked (null for self-marking)
    
    -- Verification details
    location_verified BOOLEAN DEFAULT FALSE,
    liveness_verified BOOLEAN DEFAULT FALSE,
    ip_address INET,
    user_agent TEXT,
    
    -- Location data (if location verification required)
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_accuracy DECIMAL(10, 2), -- meters
    
    -- Additional metadata
    device_info JSONB, -- Store device information
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(session_id, student_id) -- One attendance record per student per session
);

-- Attendance statistics - materialized view for performance
CREATE MATERIALIZED VIEW attendance_statistics AS
SELECT 
    ce.student_id,
    ce.class_id,
    COUNT(ar.id) as total_sessions_attended,
    COUNT(ases.id) as total_sessions_held,
    ROUND(
        (COUNT(ar.id)::DECIMAL / NULLIF(COUNT(ases.id), 0)) * 100, 2
    ) as attendance_percentage,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    MAX(ar.marked_at) as last_attendance_date
FROM class_enrollments ce
LEFT JOIN attendance_sessions ases ON ce.class_id = ases.class_id AND ases.status = 'completed'
LEFT JOIN attendance_records ar ON ases.id = ar.session_id AND ce.student_id = ar.student_id
WHERE ce.status = 'active'
GROUP BY ce.student_id, ce.class_id;

-- Create indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_student_id ON users(student_id) WHERE student_id IS NOT NULL;
CREATE INDEX idx_users_employee_id ON users(employee_id) WHERE employee_id IS NOT NULL;

CREATE INDEX idx_classes_instructor ON classes(instructor_id);
CREATE INDEX idx_classes_course ON classes(course_id);
CREATE INDEX idx_classes_semester ON classes(semester, academic_year);

CREATE INDEX idx_class_schedules_class_day ON class_schedules(class_id, day_of_week);

CREATE INDEX idx_enrollments_student ON class_enrollments(student_id);
CREATE INDEX idx_enrollments_class ON class_enrollments(class_id);
CREATE INDEX idx_enrollments_status ON class_enrollments(status);

CREATE INDEX idx_sessions_class_date ON attendance_sessions(class_id, date);
CREATE INDEX idx_sessions_status ON attendance_sessions(status);
CREATE INDEX idx_sessions_session_id ON attendance_sessions(session_id);
CREATE INDEX idx_sessions_instructor_date ON attendance_sessions(instructor_id, date);

CREATE INDEX idx_attendance_session_student ON attendance_records(session_id, student_id);
CREATE INDEX idx_attendance_student_status ON attendance_records(student_id, status);
CREATE INDEX idx_attendance_marked_at ON attendance_records(marked_at);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to refresh attendance statistics
CREATE OR REPLACE FUNCTION refresh_attendance_statistics()
RETURNS VOID AS $$
BEGIN
    REFRESH MATERIALIZED VIEW attendance_statistics;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session statistics when attendance is marked
CREATE OR REPLACE FUNCTION update_session_statistics()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE attendance_sessions SET
            total_present = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = NEW.session_id AND status = 'present'
            ),
            total_late = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = NEW.session_id AND status = 'late'
            ),
            total_absent = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = NEW.session_id AND status = 'absent'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = NEW.session_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE attendance_sessions SET
            total_present = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = OLD.session_id AND status = 'present'
            ),
            total_late = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = OLD.session_id AND status = 'late'
            ),
            total_absent = (
                SELECT COUNT(*) FROM attendance_records 
                WHERE session_id = OLD.session_id AND status = 'absent'
            ),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = OLD.session_id;
        
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_statistics
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_session_statistics();
