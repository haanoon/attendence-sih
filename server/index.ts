import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { getClasses, createAttendanceSession, getActiveSessions, markAttendance } from "./routes/attendance";
import Database from "./database";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/api/health", async (_req, res) => {
    try {
      const db = Database.getInstance();
      const health = await db.healthCheck();
      
      res.status(health.status === 'healthy' ? 200 : 503).json({
        status: health.status,
        message: health.message,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(503).json({
        status: 'unhealthy',
        message: 'Health check failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Legacy API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Attendance API routes
  app.get("/api/classes", getClasses);
  app.post("/api/sessions", createAttendanceSession);
  app.get("/api/sessions", getActiveSessions);
  app.post("/api/attendance", markAttendance);

  return app;
}
