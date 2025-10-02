import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface GradeRecord {
  id: string;
  term: string;
  academic_year: string;
  class_score: number;
  exam_score: number;
  total_score: number;
  grade: string;
  remarks: string;
  students: {
    index_number: string;
    profiles: {
      full_name: string;
    };
  };
  subjects: {
    name: string;
    code: string;
  };
  classes: {
    name: string;
  };
}

interface GradesTabProps {
  userRole: string;
}

const GradesTab = ({ userRole }: GradesTabProps) => {
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState("Term 1");
  const [selectedYear, setSelectedYear] = useState("2024/2025");

  useEffect(() => {
    loadGrades();
  }, [selectedTerm, selectedYear]);

  const loadGrades = async () => {
    try {
      const { data, error } = await supabase
        .from("grades")
        .select(`
          *,
          students:student_id(
            index_number,
            profiles:profile_id(full_name)
          ),
          subjects:subject_id(name, code),
          classes:class_id(name)
        `)
        .eq("term", selectedTerm)
        .eq("academic_year", selectedYear)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setGrades(data || []);
    } catch (error: any) {
      toast.error("Failed to load grades");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    if (!grade) return "bg-muted text-muted-foreground";
    const firstChar = grade.charAt(0).toUpperCase();
    switch (firstChar) {
      case "A":
        return "bg-secondary/10 text-secondary font-semibold";
      case "B":
        return "bg-primary/10 text-primary font-semibold";
      case "C":
        return "bg-accent/10 text-accent font-semibold";
      case "D":
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400";
      case "E":
      case "F":
        return "bg-destructive/10 text-destructive";
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
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Academic Records</CardTitle>
            <CardDescription>View student grades and performance</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={selectedTerm} onValueChange={setSelectedTerm}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Term 1">Term 1</SelectItem>
                <SelectItem value="Term 2">Term 2</SelectItem>
                <SelectItem value="Term 3">Term 3</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024/2025">2024/2025</SelectItem>
                <SelectItem value="2023/2024">2023/2024</SelectItem>
                <SelectItem value="2022/2023">2022/2023</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Index No.</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Class</TableHead>
                <TableHead className="text-right">Class Score</TableHead>
                <TableHead className="text-right">Exam Score</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Grade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    No grades recorded for this term
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.students?.index_number || "N/A"}
                    </TableCell>
                    <TableCell>{record.students?.profiles?.full_name}</TableCell>
                    <TableCell>{record.subjects?.name}</TableCell>
                    <TableCell>{record.classes?.name}</TableCell>
                    <TableCell className="text-right">{record.class_score || "-"}</TableCell>
                    <TableCell className="text-right">{record.exam_score || "-"}</TableCell>
                    <TableCell className="text-right font-semibold">{record.total_score || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(record.grade)}`}>
                        {record.grade || "N/A"}
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

export default GradesTab;
