import { RequestHandler } from "express";
import { ApiResponse, CreateAttendanceSessionRequest } from "@shared/api";
import AttendanceService from "../services/AttendanceService";

const attendanceService = new AttendanceService();

export const getClasses: RequestHandler = async (req, res) => {
  try {
    const userId = req.query.userId as string;
    const role = req.query.role as 'student' | 'faculty';

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: "userId and role are required",
      } as ApiResponse);
    }

    const classes = await attendanceService.getClassesForUser(userId, role);

    res.json({
      success: true,
      data: classes,
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting classes:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get classes",
    } as ApiResponse);
  }
};

export const createAttendanceSession: RequestHandler = async (req, res) => {
  try {
    const instructorId = req.query.instructorId as string;
    const sessionData = req.body as CreateAttendanceSessionRequest;

    if (!instructorId) {
      return res.status(400).json({
        success: false,
        error: "instructorId is required",
      } as ApiResponse);
    }

    if (!sessionData.classId || !sessionData.date || !sessionData.startTime || !sessionData.endTime) {
      return res.status(400).json({
        success: false,
        error: "classId, date, startTime, and endTime are required",
      } as ApiResponse);
    }

    const session = await attendanceService.createAttendanceSession(instructorId, sessionData);

    res.status(201).json({
      success: true,
      data: session,
      message: "Attendance session created successfully",
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating attendance session:', error);
    res.status(500).json({
      success: false,
      error: "Failed to create attendance session",
    } as ApiResponse);
  }
};

export const getActiveSessions: RequestHandler = async (req, res) => {
  try {
    const instructorId = req.query.instructorId as string | undefined;

    const sessions = await attendanceService.getActiveAttendanceSessions(instructorId);

    res.json({
      success: true,
      data: sessions,
    } as ApiResponse);
  } catch (error) {
    console.error('Error getting active sessions:', error);
    res.status(500).json({
      success: false,
      error: "Failed to get active sessions",
    } as ApiResponse);
  }
};

export const markAttendance: RequestHandler = async (req, res) => {
  try {
    const studentId = req.query.studentId as string;
    const attendanceData = req.body;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        error: "studentId is required",
      } as ApiResponse);
    }

    if (!attendanceData.sessionId || !attendanceData.status) {
      return res.status(400).json({
        success: false,
        error: "sessionId and status are required",
      } as ApiResponse);
    }

    const record = await attendanceService.markAttendance(studentId, attendanceData);

    res.json({
      success: true,
      data: record,
      message: "Attendance marked successfully",
    } as ApiResponse);
  } catch (error) {
    console.error('Error marking attendance:', error);
    const message = (error as Error).message;
    res.status(400).json({
      success: false,
      error: message,
    } as ApiResponse);
  }
};