import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";

interface Student {
  id: string;
  index_number: string;
  profile_id: string;
  date_of_birth: string;
  gender: string;
  address: string;
  parent_name: string;
  parent_phone: string;
  status: string;
  profiles: {
    full_name: string;
    email: string;
    phone: string;
  };
  classes: {
    name: string;
    level: number;
  };
}

interface StudentsTabProps {
  userRole: string;
}

const StudentsTab = ({ userRole }: StudentsTabProps) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = students.filter(student =>
        student.profiles.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.index_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(students);
    }
  }, [searchQuery, students]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          profiles:profile_id(full_name, email, phone),
          classes:class_id(name, level)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setStudents(data || []);
      setFilteredStudents(data || []);
    } catch (error: any) {
      toast.error("Failed to load students");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const canManage = userRole === "admin" || userRole === "teacher";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Students</CardTitle>
            <CardDescription>Manage student records and information</CardDescription>
          </div>
          {canManage && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Student</DialogTitle>
                  <DialogDescription>
                    Enter student information to create a new record
                  </DialogDescription>
                </DialogHeader>
                <div className="text-sm text-muted-foreground">
                  Student creation form will be implemented here
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index Number</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.index_number || "N/A"}</TableCell>
                    <TableCell>{student.profiles?.full_name}</TableCell>
                    <TableCell>{student.classes?.name || "Not Assigned"}</TableCell>
                    <TableCell className="capitalize">{student.gender || "N/A"}</TableCell>
                    <TableCell>{student.parent_phone || "N/A"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        student.status === "active" 
                          ? "bg-secondary/10 text-secondary" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {student.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default StudentsTab;
