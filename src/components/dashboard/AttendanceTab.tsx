import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";

interface AttendanceRecord {
  id: string;
  date: string;
  status: string;
  remarks: string;
  students: {
    index_number: string;
    profiles: {
      full_name: string;
    };
  };
  classes: {
    name: string;
  };
}

interface AttendanceTabProps {
  userRole: string;
}

const AttendanceTab = ({ userRole }: AttendanceTabProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    loadAttendance();
  }, [selectedDate]);

  const loadAttendance = async () => {
    try {
      const dateStr = selectedDate.toISOString().split("T")[0];
      
      const { data, error } = await supabase
        .from("attendance")
        .select(`
          *,
          students:student_id(
            index_number,
            profiles:profile_id(full_name)
          ),
          classes:class_id(name)
        `)
        .eq("date", dateStr)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error: any) {
      toast.error("Failed to load attendance");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-secondary/10 text-secondary";
      case "absent":
        return "bg-destructive/10 text-destructive";
      case "late":
        return "bg-accent/10 text-accent";
      case "excused":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Date</CardTitle>
          <CardDescription>View attendance for a specific date</CardDescription>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
          />
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {selectedDate.toLocaleDateString("en-US", { 
              weekday: "long", 
              year: "numeric", 
              month: "long", 
              day: "numeric" 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Index Number</TableHead>
                  <TableHead>Student Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                      No attendance records for this date
                    </TableCell>
                  </TableRow>
                ) : (
                  attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {record.students?.index_number || "N/A"}
                      </TableCell>
                      <TableCell>{record.students?.profiles?.full_name}</TableCell>
                      <TableCell>{record.classes?.name || "N/A"}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(record.status)}`}>
                          {record.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {record.remarks || "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTab;
