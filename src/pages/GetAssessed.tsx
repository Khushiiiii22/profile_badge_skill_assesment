import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const GetAssessed = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedSkill, setSelectedSkill] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const skills = [
    "Communication",
    "Leadership",
    "Problem Solving",
    "Teamwork",
    "Time Management",
    "Creativity",
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedSkill || !pinCode || !schoolName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Navigate to assessment request page
    navigate("/request-assessment", {
      state: { skill: selectedSkill, pinCode, schoolName }
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <Link to="/">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-4">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <Award className="h-5 w-5" />
              <span className="font-semibold">Choose Your Skill Assessment</span>
            </div>
            <h1 className="text-4xl font-bold">Get Started with Your Assessment</h1>
            <p className="text-xl text-muted-foreground">
              Select a skill and provide your details to begin your journey
            </p>
          </div>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <CardTitle>Assessment Details</CardTitle>
              <CardDescription>
                Fill in the information below to request your skill assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="skill">Select Skill *</Label>
                  <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                    <SelectTrigger id="skill">
                      <SelectValue placeholder="Choose a skill to assess" />
                    </SelectTrigger>
                    <SelectContent>
                      {skills.map((skill) => (
                        <SelectItem key={skill} value={skill}>
                          {skill}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code *</Label>
                  <Input
                    id="pinCode"
                    type="text"
                    placeholder="Enter your PIN code"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    maxLength={6}
                  />
                  <p className="text-sm text-muted-foreground">
                    This helps us find assessors near you
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schoolName">School/College Name *</Label>
                  <Input
                    id="schoolName"
                    type="text"
                    placeholder="Enter your institution name"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll check if your institution is already registered
                  </p>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Award className="h-5 w-5 text-secondary" />
                    What happens next?
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-7">
                    <li>• We'll match you with a certified assessor</li>
                    <li>• You'll receive assessment details via email</li>
                    <li>• Complete payment of ₹99 to confirm</li>
                    <li>• Get your badge and certificate after assessment</li>
                  </ul>
                </div>

                <Button type="submit" variant="hero" size="lg" className="w-full">
                  Continue to Request Assessment
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GetAssessed;