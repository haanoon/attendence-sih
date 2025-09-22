-- Sample data for the attendance management system
-- This file provides realistic test data for development and testing

-- Insert sample departments
INSERT INTO departments (id, name, code) VALUES
    (uuid_generate_v4(), 'Computer Science & Engineering', 'CSE'),
    (uuid_generate_v4(), 'Information Technology', 'IT'),
    (uuid_generate_v4(), 'Electronics & Communication', 'ECE'),
    (uuid_generate_v4(), 'Mechanical Engineering', 'ME'),
    (uuid_generate_v4(), 'Business Administration', 'MBA');

-- Insert sample faculty users
INSERT INTO users (id, email, name, role, employee_id, phone) VALUES
    (uuid_generate_v4(), 'sarah.johnson@university.edu', 'Dr. Sarah Johnson', 'faculty', 'FAC001', '+1-555-0101'),
    (uuid_generate_v4(), 'michael.chen@university.edu', 'Prof. Michael Chen', 'faculty', 'FAC002', '+1-555-0102'),
    (uuid_generate_v4(), 'priya.sharma@university.edu', 'Dr. Priya Sharma', 'faculty', 'FAC003', '+1-555-0103'),
    (uuid_generate_v4(), 'robert.wilson@university.edu', 'Prof. Robert Wilson', 'faculty', 'FAC004', '+1-555-0104'),
    (uuid_generate_v4(), 'faculty@university.edu', 'Demo Faculty', 'faculty', 'DEMO001', '+1-555-0199');

-- Insert sample student users
INSERT INTO users (id, email, name, role, student_id, phone) VALUES
    (uuid_generate_v4(), 'john.doe@student.edu', 'John Doe', 'student', 'STU2024001', '+1-555-1001'),
    (uuid_generate_v4(), 'jane.smith@student.edu', 'Jane Smith', 'student', 'STU2024002', '+1-555-1002'),
    (uuid_generate_v4(), 'alex.kumar@student.edu', 'Alex Kumar', 'student', 'STU2024003', '+1-555-1003'),
    (uuid_generate_v4(), 'maria.garcia@student.edu', 'Maria Garcia', 'student', 'STU2024004', '+1-555-1004'),
    (uuid_generate_v4(), 'david.lee@student.edu', 'David Lee', 'student', 'STU2024005', '+1-555-1005'),
    (uuid_generate_v4(), 'student@university.edu', 'Demo Student', 'student', 'DEMO2024', '+1-555-1099');

-- Insert sample courses
INSERT INTO courses (id, code, name, description, credits, department_id) VALUES
    (
        uuid_generate_v4(), 
        'CS101', 
        'Computer Science 101', 
        'Introduction to Computer Science and Programming', 
        4,
        (SELECT id FROM departments WHERE code = 'CSE' LIMIT 1)
    ),
    (
        uuid_generate_v4(), 
        'DS201', 
        'Data Structures', 
        'Fundamental Data Structures and Algorithms', 
        3,
        (SELECT id FROM departments WHERE code = 'CSE' LIMIT 1)
    ),
    (
        uuid_generate_v4(), 
        'WEB301', 
        'Web Development', 
        'Full-stack web development with modern frameworks', 
        3,
        (SELECT id FROM departments WHERE code = 'IT' LIMIT 1)
    ),
    (
        uuid_generate_v4(), 
        'DB401', 
        'Database Systems', 
        'Advanced database design and management', 
        3,
        (SELECT id FROM departments WHERE code = 'CSE' LIMIT 1)
    );

-- Insert sample classes (class instances/sections)
INSERT INTO classes (id, course_id, instructor_id, section, semester, academic_year, max_students) VALUES
    (
        uuid_generate_v4(),
        (SELECT id FROM courses WHERE code = 'CS101' LIMIT 1),
        (SELECT id FROM users WHERE email = 'sarah.johnson@university.edu' LIMIT 1),
        'A',
        'Fall 2024',
        '2024-25',
        60
    ),
    (
        uuid_generate_v4(),
        (SELECT id FROM courses WHERE code = 'DS201' LIMIT 1),
        (SELECT id FROM users WHERE email = 'michael.chen@university.edu' LIMIT 1),
        'A',
        'Fall 2024',
        '2024-25',
        45
    ),
    (
        uuid_generate_v4(),
        (SELECT id FROM courses WHERE code = 'WEB301' LIMIT 1),
        (SELECT id FROM users WHERE email = 'priya.sharma@university.edu' LIMIT 1),
        'B',
        'Fall 2024',
        '2024-25',
        40
    ),
    (
        uuid_generate_v4(),
        (SELECT id FROM courses WHERE code = 'DB401' LIMIT 1),
        (SELECT id FROM users WHERE email = 'robert.wilson@university.edu' LIMIT 1),
        'A',
        'Fall 2024',
        '2024-25',
        35
    );

-- Insert class schedules
WITH class_data AS (
    SELECT 
        c.id as class_id,
        co.code as course_code
    FROM classes c
    JOIN courses co ON c.course_id = co.id
)
INSERT INTO class_schedules (class_id, day_of_week, start_time, end_time, location, mode) VALUES
    -- CS101 - Monday, Wednesday, Friday
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), 1, '09:00', '10:30', 'Room A101', 'offline'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), 3, '09:00', '10:30', 'Room A101', 'offline'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), 5, '09:00', '10:30', 'Room A101', 'offline'),
    
    -- DS201 - Tuesday, Thursday
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), 2, '11:00', '12:30', 'Room B201', 'offline'),
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), 4, '11:00', '12:30', 'Room B201', 'offline'),
    
    -- WEB301 - Wednesday, Friday
    ((SELECT class_id FROM class_data WHERE course_code = 'WEB301'), 3, '14:00', '16:00', 'Computer Lab 1', 'hybrid'),
    ((SELECT class_id FROM class_data WHERE course_code = 'WEB301'), 5, '14:00', '16:00', 'Computer Lab 1', 'hybrid'),
    
    -- DB401 - Monday, Thursday  
    ((SELECT class_id FROM class_data WHERE course_code = 'DB401'), 1, '16:00', '17:30', 'Room C301', 'online'),
    ((SELECT class_id FROM class_data WHERE course_code = 'DB401'), 4, '16:00', '17:30', 'Room C301', 'online');

-- Enroll students in classes
WITH student_data AS (
    SELECT id as student_id, student_id as student_number FROM users WHERE role = 'student'
),
class_data AS (
    SELECT c.id as class_id, co.code as course_code FROM classes c JOIN courses co ON c.course_id = co.id
)
INSERT INTO class_enrollments (class_id, student_id, enrollment_date, status) VALUES
    -- Enroll all students in CS101
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024001'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024002'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024003'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024004'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'CS101'), (SELECT student_id FROM student_data WHERE student_number = 'DEMO2024'), '2024-08-15', 'active'),
    
    -- Enroll some students in DS201
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024001'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024003'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024005'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'DS201'), (SELECT student_id FROM student_data WHERE student_number = 'DEMO2024'), '2024-08-15', 'active'),
    
    -- Enroll some students in WEB301
    ((SELECT class_id FROM class_data WHERE course_code = 'WEB301'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024002'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'WEB301'), (SELECT student_id FROM student_data WHERE student_number = 'STU2024004'), '2024-08-15', 'active'),
    ((SELECT class_id FROM class_data WHERE course_code = 'WEB301'), (SELECT student_id FROM student_data WHERE student_number = 'DEMO2024'), '2024-08-15', 'active');

-- Update enrolled student counts in attendance_sessions (we'll add sessions next)
-- First, let's create a recent attendance session for CS101
WITH class_data AS (
    SELECT c.id as class_id FROM classes c JOIN courses co ON c.course_id = co.id WHERE co.code = 'CS101'
)
INSERT INTO attendance_sessions (
    session_id, class_id, instructor_id, date, start_time, end_time, 
    location, mode, status, expires_at, nonce, total_enrolled_students
) VALUES (
    'CS101-20241201-001',
    (SELECT class_id FROM class_data),
    (SELECT id FROM users WHERE email = 'sarah.johnson@university.edu'),
    CURRENT_DATE - INTERVAL '1 day',
    '09:00',
    '10:30',
    'Room A101',
    'offline',
    'completed',
    (CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '2 hours'),
    'nonce-cs101-001',
    5
);

-- Add some sample attendance records for the session
WITH session_data AS (
    SELECT id as session_id FROM attendance_sessions WHERE session_id = 'CS101-20241201-001'
),
student_data AS (
    SELECT id as student_id, student_id as student_number FROM users WHERE role = 'student'
)
INSERT INTO attendance_records (session_id, student_id, status, marked_at, location_verified, liveness_verified) VALUES
    ((SELECT session_id FROM session_data), (SELECT student_id FROM student_data WHERE student_number = 'STU2024001'), 'present', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '5 minutes', true, true),
    ((SELECT session_id FROM session_data), (SELECT student_id FROM student_data WHERE student_number = 'STU2024002'), 'present', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '7 minutes', true, true),
    ((SELECT session_id FROM session_data), (SELECT student_id FROM student_data WHERE student_number = 'STU2024003'), 'late', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '15 minutes', true, true),
    ((SELECT session_id FROM session_data), (SELECT student_id FROM student_data WHERE student_number = 'STU2024004'), 'absent', NULL, false, false),
    ((SELECT session_id FROM session_data), (SELECT student_id FROM student_data WHERE student_number = 'DEMO2024'), 'present', CURRENT_TIMESTAMP - INTERVAL '1 day' + INTERVAL '3 minutes', true, true);

-- Refresh the materialized view
SELECT refresh_attendance_statistics();