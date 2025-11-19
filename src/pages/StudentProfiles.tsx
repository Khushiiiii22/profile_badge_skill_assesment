import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

interface StudentProfile {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
}

const StudentProfiles = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfiles();
  }, []);

  const fetchStudentProfiles = async () => {
    try {
      // Fetch all students with 'approved' assessments
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select(`
          user_id,
          skill_name,
          status,
          profiles(id, full_name, email)
        `)
        .eq('status', 'approved');

      if (assessmentError) throw assessmentError;

      // Group assessments by user
      const studentMap = new Map<string, StudentProfile>();

      assessments?.forEach((assessment: any) => {
        const userId = assessment.user_id;
        const profile = assessment.profiles;

        if (!studentMap.has(userId)) {
          studentMap.set(userId, {
            id: userId,
            full_name: profile?.full_name || 'Unknown',
            email: profile?.email || '',
            skills: []
          });
        }

        const student = studentMap.get(userId);
        if (student && !student.skills.includes(assessment.skill_name)) {
          student.skills.push(assessment.skill_name);
        }
      });

      setStudents(Array.from(studentMap.values()));
    } catch (error) {
      console.error('Error fetching student profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading student profiles...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Student Profiles</h1>
        <p className="text-gray-600">Discover students and their certified skills</p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">No certified students yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  {student.full_name}
                </CardTitle>
                <p className="text-sm text-gray-500">{student.email}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Certified Skills:</p>
                  <div className="flex flex-wrap gap-2">
                    {student.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentProfiles;
