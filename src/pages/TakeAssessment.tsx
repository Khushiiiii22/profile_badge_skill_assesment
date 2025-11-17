import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Award, CheckCircle, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tables } from "@/integrations/supabase/types";

type Question = Tables<'questions'>;
type Assessment = Tables<'assessments'>;

const TakeAssessment = () => {
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);

  useEffect(() => {
    if (assessmentId) {
      fetchAssessmentAndQuestions();
    }
  }, [assessmentId]);

  const fetchAssessmentAndQuestions = async () => {
    try {
      setLoading(true);

      console.log('Fetching assessment with ID:', assessmentId);

      // Fetch assessment details
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      console.log('Assessment data:', assessmentData);

      setAssessment(assessmentData);

      // Fetch questions for the skill - use skill_name from the current schema
      console.log('Fetching questions for skill:', assessmentData.skill_name);
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select('*')
        .eq('skill', assessmentData.skill_name || '');

      if (questionsError) throw questionsError;

      console.log('Questions loaded:', questionsData?.length || 0);

      setQuestions(questionsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load assessment questions.",
        variant: "destructive",
      });
      navigate("/my-skill-profile");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!assessment) return;

    try {
      setSubmitting(true);

      // Calculate score
      let correctAnswers = 0;
      questions.forEach(question => {
        if (answers[question.id] === question.correct_answer) {
          correctAnswers++;
        }
      });

      const calculatedScore = Math.round((correctAnswers / questions.length) * 100);
      const passedAssessment = calculatedScore >= 70;

      setScore(calculatedScore);
      setPassed(passedAssessment);

      // Update assessment record - store score in assessment_data JSON field
      const { error: updateError } = await supabase
        .from('assessments')
        .update({
          assessment_data: {
            ...((assessment as any).assessment_data || {}),
            score: calculatedScore,
            assessment_date: new Date().toISOString(),
            status: passedAssessment ? 'completed' : 'completed' // Mark as completed regardless
          }
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      setShowResults(true);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToProfile = () => {
    navigate("/profile");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Assessment Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The requested assessment could not be loaded.
            </p>
            <Button onClick={handleBackToProfile}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {passed ? (
                    <CheckCircle className="h-16 w-16 text-green-500" />
                  ) : (
                    <XCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  Assessment Complete!
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">{assessment.skill_name} Assessment</h3>
                  <div className="text-3xl font-bold mb-2">{score}%</div>
                  <Progress value={score} className="h-3" />
                </div>

                <div className="flex justify-center">
                  <Badge
                    variant={passed ? "default" : "destructive"}
                    className={`text-lg px-4 py-2 ${passed ? 'bg-green-500' : ''}`}
                  >
                    {passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>

                <div className="text-left bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Assessment Summary:</h4>
                  <p className="text-sm text-muted-foreground">
                    You answered {score >= 70 ? Math.round((score / 100) * questions.length) : Math.round((score / 100) * questions.length)} out of {questions.length} questions correctly.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Passing threshold: 70%
                  </p>
                </div>

                <Button onClick={handleBackToProfile} className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Profile
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  const answersFilled = Object.keys(answers).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToProfile}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Profile
            </Button>

            <div className="flex items-center justify-between mb-2">
              <h1 className="text-2xl font-bold">{assessment.skill_name} Assessment</h1>
              <Badge variant="outline">
                Question {currentQuestionIndex + 1} of {questions.length}
              </Badge>
            </div>

            <Progress value={progress} className="h-2" />
          </div>

          {/* Question Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-left">{currentQuestion.question_text}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={answers[currentQuestion.id]?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
              >
                {Array.isArray(currentQuestion.options) && currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="cursor-pointer">
                      {String(option)}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
            >
              Previous
            </Button>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={handleSubmit}
                disabled={answersFilled !== questions.length || submitting}
              >
                {submitting ? "Submitting..." : "Submit Assessment"}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={answers[currentQuestion.id] === undefined}
              >
                Next
              </Button>
            )}
          </div>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            {answersFilled} of {questions.length} questions answered
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeAssessment;