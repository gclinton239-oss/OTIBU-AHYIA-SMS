import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, BookOpen, Calendar, BarChart3, LogOut, GraduationCap, Camera } from "lucide-react";
import { toast } from "sonner";
import StudentsTab from "@/components/dashboard/StudentsTab";
import AttendanceTab from "@/components/dashboard/AttendanceTab";
import GradesTab from "@/components/dashboard/GradesTab";
import FaceRecognitionAttendance from "@/components/FaceRecognitionAttendance";

interface Profile {
  id: string;
  full_name: string;
  role: string;
  email: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalStudents: 0,
    presentToday: 0,
    totalClasses: 0,
    totalSubjects: 0
  });

  useEffect(() => {
    checkAuth();
    loadStats();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      
      // Get role from secure user_roles table
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      
      setProfile({
        ...profileData,
        role: roleData?.role || 'student'
      });
    } catch (error) {
      console.error("Auth error:", error);
      navigate("/auth");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [studentsRes, classesRes, subjectsRes, attendanceRes] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("classes").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("id", { count: "exact", head: true })
          .eq("date", new Date().toISOString().split("T")[0])
          .eq("status", "present")
      ]);

      setStats({
        totalStudents: studentsRes.count || 0,
        presentToday: attendanceRes.count || 0,
        totalClasses: classesRes.count || 0,
        totalSubjects: subjectsRes.count || 0
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to log out");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "text-primary" },
    { title: "Present Today", value: stats.presentToday, icon: Calendar, color: "text-secondary" },
    { title: "Classes", value: stats.totalClasses, icon: BookOpen, color: "text-accent" },
    { title: "Subjects", value: stats.totalSubjects, icon: BarChart3, color: "text-primary" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold">ASUBOI OTIBU AHYIA D/A JHS</h1>
              <p className="text-sm text-muted-foreground">School Management System</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-medium">{profile?.full_name}</p>
              <p className="text-sm text-muted-foreground capitalize">{profile?.role}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="students">
              <Users className="h-4 w-4 mr-2" />
              Students
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <Calendar className="h-4 w-4 mr-2" />
              Attendance
            </TabsTrigger>
            <TabsTrigger value="ai-attendance">
              <Camera className="h-4 w-4 mr-2" />
              AI Attendance
            </TabsTrigger>
            <TabsTrigger value="grades">
              <BarChart3 className="h-4 w-4 mr-2" />
              Grades
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students">
            <StudentsTab userRole={profile?.role || ""} />
          </TabsContent>

          <TabsContent value="attendance">
            <AttendanceTab userRole={profile?.role || ""} />
          </TabsContent>

          <TabsContent value="ai-attendance">
            <FaceRecognitionAttendance />
          </TabsContent>

          <TabsContent value="grades">
            <GradesTab userRole={profile?.role || ""} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
