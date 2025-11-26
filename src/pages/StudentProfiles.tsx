import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Calendar, Phone, Mail, User, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

interface Assessment {
  id: string;
  user_id?: string;
  skill_name: string;
  status: string;
  score: number | null;
  certificate_url: string | null;
  created_at: string;
  assessment_date: string | null;
  verified_by_assessor: string | null;
  rejection_reason: string | null;
  verified_at: string | null;
  assessment_data: any;
}

interface StudentProfile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  assessments: Assessment[];
  isCertified: boolean;
}

const StudentProfiles = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentProfiles();
    // eslint-disable-next-line
  }, []);

  const fetchStudentProfiles = async () => {
    try {
      // Fetch only users with student role from user_roles table
      const { data: studentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'student');

      if (rolesError) throw rolesError;

      // Extract student user IDs
      const studentIds = (studentRoles || []).map(role => role.user_id);

      if (studentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      // Fetch users who have assessor or admin roles (to exclude them)
      const { data: assessorRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .in('role', ['assessor', 'admin']);

      // Exclude users who are assessors or admins
      const assessorIds = new Set((assessorRoles || []).map(role => role.user_id));
      const pureStudentIds = studentIds.filter(id => !assessorIds.has(id));

      if (pureStudentIds.length === 0) {
        setStudents([]);
        setLoading(false);
        return;
      }

      console.log('📊 Pure student IDs:', pureStudentIds.length);

      // Fetch profiles for students only (excluding assessors/admins)
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', pureStudentIds)
        .order('created_at', { ascending: false });

      if (profileError) throw profileError;

      console.log('📊 Fetched profiles:', profiles?.map(p => ({ id: p.id, full_name: p.full_name, email: p.email })));

      // Fetch all assessments for students only
      const { data: assessments, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .in('user_id', pureStudentIds)
        .order('created_at', { ascending: false });

      if (assessmentError) throw assessmentError;

      // Group assessments by user
      const assessmentMap = new Map<string, Assessment[]>();
      (assessments || []).forEach((assessment) => {
        const userId = assessment.user_id;
        if (!userId) return;
        if (!assessmentMap.has(userId)) {
          assessmentMap.set(userId, []);
        }
        assessmentMap.get(userId)!.push(assessment as Assessment);
      });

      // Combine profiles with assessments
      const studentsData: StudentProfile[] = (profiles || []).map((profile) => {
        const assessments = assessmentMap.get(profile.id) || [];
        // "accepted" or "approved" as per your business logic—adjust as needed:
        const isCertified = assessments.some(a => a.status === 'accepted' || a.status === 'approved' || a.status === "completed");
        
        // Get name with proper fallback
        const displayName = profile.full_name || profile.email?.split('@')[0] || 'Student';
        
        return {
          id: profile.id,
          name: displayName,
          email: profile.email,
          phone: profile.phone,
          created_at: profile.created_at,
          assessments: assessments,
          isCertified: isCertified
        };
      });

      setStudents(studentsData);
    } catch (error) {
      console.error('Error fetching student profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'approved':
      case 'completed':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Certified</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      case 'in_progress':
        return <Badge variant="outline"><AlertTriangle className="w-3 h-3 mr-1" />In Progress</Badge>;
      case 'awaiting_approval':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Awaiting Approval</Badge>;
      case 'cancelled':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
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
        <p className="text-gray-600">View all student profiles and their certification status</p>
      </div>

      {students.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-gray-500">No student profiles found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {students.map((student) => (
            <Card key={student.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    {student.name}
                    {student.isCertified && (
                      <Badge className="bg-green-500 ml-2">
                        <Award className="w-3 h-3 mr-1" />
                        Certified
                      </Badge>
                    )}
                  </div>
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {student.email}
                  </div>
                  {student.phone && (
                    <div className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {student.phone}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Signed up: {formatDate(student.created_at)}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-3">Assessments ({student.assessments.length})</h4>
                    {student.assessments.length === 0 ? (
                      <p className="text-sm text-gray-500">No assessments yet</p>
                    ) : (
                      <div className="space-y-3">
                        {student.assessments.map((assessment) => (
                          <div key={assessment.id} className="border rounded-lg p-3 bg-gray-50">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{assessment.skill_name}</span>
                                {getStatusBadge(assessment.status)}
                              </div>
                              {assessment.certificate_url && (assessment.status === 'accepted' || assessment.status === 'approved' || assessment.status === 'completed') && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => window.open(assessment.certificate_url!, '_blank')}
                                >
                                  View Certificate
                                </Button>
                              )}
                            </div>
                            <div className="text-sm text-gray-600 space-y-1">
                              <div>Requested: {formatDate(assessment.created_at)}</div>
                              {assessment.assessment_date && (
                                <div>Assessed: {formatDate(assessment.assessment_date)}</div>
                              )}
                              {assessment.score !== null && (
                                <div>Score: {assessment.score}%</div>
                              )}
                              {assessment.status === 'rejected' && assessment.rejection_reason && (
                                <div className="text-red-600">Reason: {assessment.rejection_reason}</div>
                              )}
                              {assessment.verified_by_assessor && (
                                <div>Verified by: {assessment.verified_by_assessor}</div>
                              )}
                              {assessment.verified_at && (
                                <div>Verified on: {formatDate(assessment.verified_at)}</div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
