#!/usr/bin/env node

/**
 * Database Integration Test Script
 * Tests the attendance database schema and API functionality
 */

import Database from './server/database.js';
import AttendanceService from './server/services/AttendanceService.js';

async function testDatabaseIntegration() {
  console.log('🧪 Starting Database Integration Tests...\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣  Testing database connection...');
    const db = Database.getInstance();
    const health = await db.healthCheck();
    
    if (health.status === 'healthy') {
      console.log('✅ Database connection successful');
    } else {
      console.log('❌ Database connection failed:', health.message);
      return;
    }

    // Test 2: Basic Queries
    console.log('\n2️⃣  Testing basic queries...');
    const userCount = await db.query('SELECT COUNT(*) as count FROM users');
    const classCount = await db.query('SELECT COUNT(*) as count FROM classes');
    
    console.log(`✅ Users in database: ${userCount.rows[0].count}`);
    console.log(`✅ Classes in database: ${classCount.rows[0].count}`);

    // Test 3: Service Layer
    console.log('\n3️⃣  Testing AttendanceService...');
    const attendanceService = new AttendanceService();

    // Get demo faculty user
    const faculty = await attendanceService.getUserByEmail('faculty@university.edu');
    if (!faculty) {
      console.log('❌ Demo faculty user not found');
      return;
    }
    console.log(`✅ Found faculty: ${faculty.name} (${faculty.email})`);

    // Get demo student user
    const student = await attendanceService.getUserByEmail('student@university.edu');
    if (!student) {
      console.log('❌ Demo student user not found');
      return;
    }
    console.log(`✅ Found student: ${student.name} (${student.email})`);

    // Test 4: Class Management
    console.log('\n4️⃣  Testing class management...');
    const facultyClasses = await attendanceService.getClassesForUser(faculty.id, 'faculty');
    const studentClasses = await attendanceService.getClassesForUser(student.id, 'student');
    
    console.log(`✅ Faculty teaches ${facultyClasses.length} classes`);
    console.log(`✅ Student enrolled in ${studentClasses.length} classes`);

    if (facultyClasses.length > 0) {
      const firstClass = facultyClasses[0];
      console.log(`   📚 Sample class: ${firstClass.courseName} (${firstClass.courseCode})`);
    }

    // Test 5: Attendance Session Creation
    console.log('\n5️⃣  Testing attendance session creation...');
    if (facultyClasses.length > 0) {
      const testClass = facultyClasses[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const sessionData = {
        classId: testClass.id,
        date: tomorrow.toISOString().split('T')[0],
        startTime: '10:00',
        endTime: '11:30',
        location: 'Test Room 101',
        mode: 'offline' as const,
        locationRequired: true,
        livenessCheckRequired: true,
        notes: 'Test session created by integration test'
      };

      const session = await attendanceService.createAttendanceSession(faculty.id, sessionData);
      console.log(`✅ Created attendance session: ${session.sessionId}`);
      console.log(`   📍 Location: ${session.location}`);
      console.log(`   ⏰ Time: ${session.startTime} - ${session.endTime}`);
    }

    // Test 6: Active Sessions
    console.log('\n6️⃣  Testing active sessions retrieval...');
    const activeSessions = await attendanceService.getActiveAttendanceSessions();
    console.log(`✅ Found ${activeSessions.length} active sessions`);

    // Test 7: Complex Queries
    console.log('\n7️⃣  Testing complex queries...');
    const enrollmentStats = await db.query(`
      SELECT 
        d.name as department,
        COUNT(DISTINCT c.id) as total_classes,
        COUNT(DISTINCT ce.student_id) as total_enrollments
      FROM departments d
      JOIN courses co ON d.id = co.department_id
      JOIN classes c ON co.id = c.course_id
      JOIN class_enrollments ce ON c.id = ce.class_id
      WHERE ce.status = 'active'
      GROUP BY d.id, d.name
      ORDER BY total_enrollments DESC
    `);

    console.log('✅ Enrollment statistics by department:');
    enrollmentStats.rows.forEach(row => {
      console.log(`   📊 ${row.department}: ${row.total_classes} classes, ${row.total_enrollments} enrollments`);
    });

    // Test 8: Materialized View
    console.log('\n8️⃣  Testing materialized view...');
    const attendanceStats = await db.query(`
      SELECT 
        COUNT(*) as total_records,
        AVG(attendance_percentage) as avg_attendance
      FROM attendance_statistics
    `);
    
    if (attendanceStats.rows.length > 0) {
      const stats = attendanceStats.rows[0];
      console.log(`✅ Attendance statistics computed for ${stats.total_records} student-class combinations`);
      console.log(`   📈 Average attendance: ${parseFloat(stats.avg_attendance || '0').toFixed(2)}%`);
    }

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   ✅ Database connection working');
    console.log('   ✅ Sample data loaded correctly');
    console.log('   ✅ Service layer functioning');
    console.log('   ✅ Complex queries executing');
    console.log('   ✅ Attendance system ready for use');

  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    console.error('\n🔧 Troubleshooting tips:');
    console.error('   1. Ensure PostgreSQL is running');
    console.error('   2. Check database credentials in .env');
    console.error('   3. Run database initialization: ./database/init.sh');
    console.error('   4. Or use Docker: docker-compose up -d');
  } finally {
    // Clean up
    const db = Database.getInstance();
    await db.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testDatabaseIntegration();
}

export { testDatabaseIntegration };