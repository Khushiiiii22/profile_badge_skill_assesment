import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Class 10 Student",
    location: "Delhi",
    rating: 5,
    text: "SkillN helped me understand my true strengths beyond academics. The communication badge boosted my confidence!",
  },
  {
    name: "Rajesh Kumar",
    role: "Parent",
    location: "Mumbai",
    rating: 5,
    text: "As a parent, I'm thrilled to see my child's skills being recognized professionally. The assessors are highly qualified.",
  },
  {
    name: "Anjali Desai",
    role: "School Principal",
    location: "Bangalore",
    rating: 5,
    text: "SkillN has transformed how we evaluate student development. It's beyond marks and focuses on real-world skills.",
  },
];

const Testimonials = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl font-bold">What People Say</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Trusted by students, parents, and educators across India
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="relative overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
              <CardContent className="p-8">
                <Quote className="h-10 w-10 text-primary/20 mb-4" />
                
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.text}"
                </p>
                
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.location}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;