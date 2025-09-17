import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Index() {
  const navigate = useNavigate();
  const [role, setRole] = useState<"student" | "faculty">("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const existing = localStorage.getItem("auth");
    if (existing) navigate("/portal");
  }, [navigate]);

  const signIn = (e: React.FormEvent) => {
    e.preventDefault();
    const token = `${role}-${Date.now()}`;
    localStorage.setItem(
      "auth",
      JSON.stringify({ token, role, email })
    );
    navigate("/portal");
  };

  const fillDemo = (kind: "student" | "faculty") => {
    setRole(kind);
    setEmail(kind === "student" ? "student@university.edu" : "faculty@university.edu");
    setPassword(kind === "student" ? "student123" : "faculty123");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(1200px_600px_at_-10%_-10%,#EEF2FF,transparent),radial-gradient(1200px_600px_at_110%_110%,#E0E7FF,transparent)]">
      <div className="w-full max-w-md rounded-xl border bg-white shadow-xl backdrop-blur-sm">
        <div className="p-8">
          <div className="mx-auto mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <span className="text-lg">🎓</span>
          </div>
          <h1 className="text-center text-2xl font-semibold">Attendance System</h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">Sign in to your account to continue</p>

          <form onSubmit={signIn} className="mt-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={role} onValueChange={(v) => setRole(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base">Sign In</Button>
          </form>

          <div className="mt-6">
            <div className="text-center text-xs text-muted-foreground">DEMO ACCOUNTS</div>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Button type="button" variant="secondary" onClick={() => fillDemo("student")}>Student Demo</Button>
              <Button type="button" variant="secondary" onClick={() => fillDemo("faculty")}>Faculty Demo</Button>
            </div>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Student: student@university.edu / student123<br/>
              Faculty: faculty@university.edu / faculty123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
