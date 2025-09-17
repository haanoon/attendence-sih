import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QRCode from "qrcode";

// Lightweight shared types
export type Role = "student" | "faculty";

interface ClassInfo { id: string; name: string; time: string; instructor: string; mode: "offline" | "online" }

interface SessionPayload { sessionId: string; classId: string; issuedAt: number; exp: number; nonce: string; mode: "offline" | "online" }

const classes: ClassInfo[] = [
  { id: "cs101", name: "Computer Science 101", time: "09:00 AM", instructor: "Dr. Sarah Johnson", mode: "offline" },
  { id: "ds201", name: "Data Structures", time: "11:00 AM", instructor: "Prof. Mike Davis", mode: "online" },
  { id: "alg301", name: "Algorithms", time: "02:00 PM", instructor: "Dr. Lisa Chen", mode: "offline" },
];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;

type DayKey = typeof weekDays[number];

type ScheduledItem = { time: string; classId: string; room?: string; mode: "offline" | "online" };

const studentSchedule: Record<DayKey, ScheduledItem[]> = {
  Mon: [
    { time: "09:00", classId: "cs101", room: "Eng. Building - 204", mode: "offline" },
    { time: "11:00", classId: "ds201", room: "Online", mode: "online" },
  ],
  Tue: [
    { time: "14:00", classId: "alg301", room: "Science - 105", mode: "offline" },
  ],
  Wed: [
    { time: "09:00", classId: "cs101", room: "Eng. Building - 204", mode: "offline" },
    { time: "11:00", classId: "ds201", room: "Online", mode: "online" },
  ],
  Thu: [
    { time: "14:00", classId: "alg301", room: "Science - 105", mode: "offline" },
  ],
  Fri: [
    { time: "09:00", classId: "cs101", room: "Eng. Building - 204", mode: "offline" },
  ],
};

function useAuth() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role | null>(null);
  useEffect(() => {
    const raw = localStorage.getItem("auth");
    if (!raw) {
      navigate("/");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as { role: Role; email: string };
      setRole(parsed.role);
    } catch {
      navigate("/");
    }
  }, [navigate]);
  const signOut = () => {
    localStorage.removeItem("auth");
    navigate("/");
  };
  return { role, signOut };
}

function Header({ title, onSignOut }: { title: string; onSignOut: () => void }) {
  return (
    <div className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">🎓</div>
          <div className="leading-tight">
            <div className="font-semibold">{title}</div>
            <div className="text-xs text-muted-foreground">Welcome back</div>
          </div>
        </div>
        <Button variant="secondary" onClick={onSignOut}>Sign Out</Button>
      </div>
    </div>
  );
}

export default function Portal() {
  const { role, signOut } = useAuth();
  if (!role) return null;

  return role === "student" ? (
    <StudentPortal onSignOut={signOut} />
  ) : (
    <FacultyPortal onSignOut={signOut} />
  );
}

function Metric({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-xl">{value}</CardTitle>
      </CardHeader>
      {sub ? <CardContent className="pt-0 text-sm text-muted-foreground">{sub}</CardContent> : null}
    </Card>
  );
}

function StudentPortal({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div>
      <Header title="Student Portal" onSignOut={onSignOut} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="timetable">Timetable</TabsTrigger>
            <TabsTrigger value="mark">Mark Attendance</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Metric label="Attendance Rate" value="92.9%" sub="39/42 classes" />
              <Metric label="Current Streak" value="5" sub="Consecutive days" />
              <Metric label="Today's Classes" value="3" sub="1 attendance open" />
              <Metric label="Next Class" value="11:00" sub="Data Structures" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.time} • {c.instructor}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs rounded-full border px-2 py-0.5 text-muted-foreground">{c.mode === "online" ? "online" : "offline"}</span>
                      <Button size="sm" variant="secondary">Mark Present</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timetable" className="mt-4">
            <WeeklyTimetable />
          </TabsContent>

          <TabsContent value="mark" className="mt-4">
            <StudentMarkAttendance />
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance History</CardTitle>
                <CardDescription>Recent classes and status</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {classes.map((c, i) => (
                  <div key={c.id + i} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.instructor}</div>
                    </div>
                    <div className="text-xs rounded-full bg-green-600 text-white px-2 py-0.5">Present</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function WeeklyTimetable() {
  const getClass = (id: string) => classes.find((c) => c.id === id)!;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Weekly Timetable</CardTitle>
        <CardDescription>Overview of classes for the week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          {weekDays.map((d) => (
            <div key={d} className="rounded-lg border p-3">
              <div className="mb-2 font-medium">{d}</div>
              <div className="space-y-2">
                {studentSchedule[d].length === 0 && (
                  <div className="text-xs text-muted-foreground">No classes</div>
                )}
                {studentSchedule[d].map((it, idx) => (
                  <div key={d + idx} className="rounded-md border px-3 py-2">
                    <div className="text-xs text-muted-foreground">{it.time}</div>
                    <div className="text-sm">{getClass(it.classId).name}</div>
                    <div className="text-xs text-muted-foreground">{it.mode === "online" ? "online" : it.room}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentMarkAttendance() {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const next = () => setStep((s) => Math.min(3, (s + 1) as any));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Scan QR</CardTitle>
        <CardDescription>Follow the steps to mark your attendance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-4 gap-2 text-xs">
          {[
            { label: "Scan QR" },
            { label: "Location" },
            { label: "Identity" },
            { label: "Complete" },
          ].map((s, i) => (
            <div key={s.label} className={`h-2 rounded-full ${i <= step ? "bg-primary" : "bg-muted"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-3">
            <div className="grid place-items-center h-44 rounded-lg border border-dashed text-muted-foreground">Camera viewfinder</div>
            <Button className="w-full" onClick={next}>Simulate QR Scan</Button>
            <p className="text-xs text-muted-foreground">In a real app, this would open your camera.</p>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm">Share your location for verification</p>
            <Button className="w-full" onClick={next}>Share Location</Button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm">Quick liveliness check</p>
            <Button className="w-full" onClick={next}>Simulate Check</Button>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-3">
            <div className="text-green-700">Attendance marked successfully.</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FacultyPortal({ onSignOut }: { onSignOut: () => void }) {
  return (
    <div>
      <Header title="Faculty Portal" onSignOut={onSignOut} />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="start">Start Session</TabsTrigger>
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
              <Metric label="Today's Classes" value="3" sub="2 scheduled, 1 active" />
              <Metric label="Total Students" value="125" sub="Across all classes" />
              <Metric label="Avg Attendance" value="92.7%" sub="Last 7 days" />
              <Metric label="Active Session" value="0" sub="None active" />
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Today's Classes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {classes.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div>
                      <div className="font-medium">{c.name}</div>
                      <div className="text-sm text-muted-foreground">{c.time} • {c.mode} • {c.instructor}</div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="secondary">Start</Button>
                      <Button size="sm">Monitor</Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <FacultyWeeklyPlan />
          </TabsContent>

          <TabsContent value="start" className="mt-4">
            <StartSession />
          </TabsContent>

          <TabsContent value="monitor" className="mt-4">
            <Card>
              <CardContent className="py-16 text-center text-muted-foreground">No Active Session</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-4">
            <Reports />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function FacultyWeeklyPlan() {
  const getClass = (id: string) => classes.find((c) => c.id === id)!;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">This Week's Classes to Cover</CardTitle>
        <CardDescription>Plan for upcoming sessions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-5">
          {weekDays.map((d) => (
            <div key={d} className="rounded-lg border p-3">
              <div className="mb-2 font-medium">{d}</div>
              <div className="space-y-2">
                {studentSchedule[d].map((it, idx) => (
                  <div key={d + idx} className="flex items-center justify-between rounded-md border px-3 py-2">
                    <div>
                      <div className="text-sm">{getClass(it.classId).name}</div>
                      <div className="text-xs text-muted-foreground">{it.time} • {it.mode === "online" ? "online" : it.room}</div>
                    </div>
                    <Button size="sm" variant="secondary">Prepare</Button>
                  </div>
                ))}
                {studentSchedule[d].length === 0 && (
                  <div className="text-xs text-muted-foreground">No classes</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function StartSession() {
  const [classId, setClassId] = useState<string>("");
  const [mode, setMode] = useState<"offline" | "online">("offline");
  const [active, setActive] = useState<SessionPayload | null>(null);
  const [qr, setQr] = useState<string>("");
  const intervalRef = useRef<number | null>(null);

  const selected = useMemo(() => classes.find((c) => c.id === classId) || null, [classId]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, []);

  const generate = async (prev?: SessionPayload) => {
    const now = Date.now();
    const payload: SessionPayload = {
      sessionId: prev?.sessionId || crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
      classId: classId,
      issuedAt: now,
      exp: now + 45_000,
      nonce: crypto.getRandomValues(new Uint32Array(1))[0].toString(36),
      mode,
    };
    const data = JSON.stringify(payload);
    const url = await QRCode.toDataURL(data, { margin: 1, scale: 6 });
    setQr(url);
    setActive(payload);
  };

  const start = async () => {
    if (!classId) return;
    await generate();
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => generate(active || undefined), 45_000) as unknown as number;
  };

  const stop = () => {
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = null;
    setActive(null);
    setQr("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance Session</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Class</label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Session Mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offline">Offline (QR Code)</SelectItem>
                <SelectItem value="online">Online (Meeting Link)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {!active ? (
          <Button className="w-full" disabled={!classId} onClick={start}>Start Attendance Session</Button>
        ) : (
          <div className="space-y-4">
            {mode === "offline" ? (
              <div className="grid md:grid-cols-[280px_1fr] gap-6">
                <div className="rounded-lg border p-3 bg-white">
                  {qr ? <img alt="QR code" src={qr} className="mx-auto" /> : null}
                </div>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">Session Details</div>
                  <div>Class: {selected?.name}</div>
                  <div>Session ID: {active.sessionId}</div>
                  <div>Expires: {new Date(active.exp).toLocaleTimeString()}</div>
                  <div className="text-muted-foreground">QR refreshes every 45 seconds.</div>
                  <Button variant="secondary" onClick={stop}>End Session</Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="font-medium">Meeting Link</div>
                <Input readOnly value={`https://example.edu/meet/${active.sessionId}`} />
                <div className="text-sm text-muted-foreground">Share this link with students. Random liveliness checks occur during the session.</div>
                <Button variant="secondary" onClick={stop}>End Session</Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Reports() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance Reports & Analytics</CardTitle>
        <CardDescription>Filters and quick KPIs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-4">
          <Metric label="Average Attendance" value="91%" sub="↑2.1% from last week" />
          <Metric label="Total Sessions" value="37" sub="This semester" />
          <Metric label="Active Students" value="125" sub="Across all classes" />
          <Metric label="Best Day" value="Wednesday" sub="98% attendance rate" />
        </div>
      </CardContent>
    </Card>
  );
}
