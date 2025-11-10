import { MessageCircle, Users, Lightbulb, Clock, Palette, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import skillCommunication from "@/assets/skill-communication.jpg";
import skillLeadership from "@/assets/skill-leadership.jpg";
import skillProblemSolving from "@/assets/skill-problem-solving.jpg";

const skills = [
  {
    icon: MessageCircle,
    name: "Communication",
    description: "Master verbal and written expression",
    image: skillCommunication,
  },
  {
    icon: Users,
    name: "Leadership",
    description: "Lead and inspire teams effectively",
    image: skillLeadership,
  },
  {
    icon: Lightbulb,
    name: "Problem Solving",
    description: "Think critically and find solutions",
    image: skillProblemSolving,
  },
  {
    icon: TrendingUp,
    name: "Teamwork",
    description: "Collaborate and achieve together",
    image: null,
  },
  {
    icon: Clock,
    name: "Time Management",
    description: "Plan, prioritize, and execute",
    image: null,
  },
  {
    icon: Palette,
    name: "Creativity",
    description: "Innovate and express artistically",
    image: null,
  },
];

const SkillsShowcase = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold">6 Essential Life Skills</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Develop and showcase the skills that truly matter in life and career
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {skills.map((skill, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden border-2 hover:border-primary/50"
            >
              <CardContent className="p-6">
                {skill.image ? (
                  <div className="mb-4 rounded-lg overflow-hidden h-40">
                    <img 
                      src={skill.image} 
                      alt={`${skill.name} skill icon`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-lg mb-4 flex items-center justify-center h-40">
                    <skill.icon className="h-16 w-16 text-primary" />
                  </div>
                )}
                
                <h3 className="text-xl font-semibold mb-2">{skill.name}</h3>
                <p className="text-muted-foreground">{skill.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SkillsShowcase;