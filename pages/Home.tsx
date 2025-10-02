import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, BookOpen, BarChart3, Calendar, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const Home = () => {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Complete student records, enrollment, and tracking system"
    },
    {
      icon: Calendar,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with notifications"
    },
    {
      icon: BookOpen,
      title: "Academic Records",
      description: "Manage grades, subjects, and academic performance"
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive insights into school performance"
    },
    {
      icon: FileText,
      title: "Digital Records",
      description: "Paperless management of all school documentation"
    },
    {
      icon: GraduationCap,
      title: "Multi-Role Access",
      description: "Secure access for admins, teachers, students, and parents"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-secondary py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col items-center text-center space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <GraduationCap className="h-16 w-16 text-white" />
              <h1 className="text-5xl md:text-6xl font-bold text-white">
                ASUBOI OTIBU AHYIA D/A JHS
              </h1>
            </div>
            <p className="text-xl md:text-2xl text-white/90 max-w-3xl">
              Modern School Management System
            </p>
            <p className="text-lg text-white/80 max-w-2xl">
              Streamline your school operations with our comprehensive digital platform. 
              Manage students, track attendance, record grades, and generate insights - all in one place.
            </p>
            <div className="flex flex-wrap gap-4 justify-center mt-8">
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="text-lg px-8">
                  Get Started
                </Button>
              </Link>
              <Link to="/dashboard">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/10 text-white border-white/30 hover:bg-white/20">
                  View Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to manage your school efficiently and effectively
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join the digital transformation of school management
          </p>
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8">
              Access System
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 bg-primary text-white">
        <div className="container mx-auto max-w-6xl text-center">
          <p className="text-white/80">
            © 2025 ASUBOI OTIBU AHYIA D/A JHS - School Management System
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
