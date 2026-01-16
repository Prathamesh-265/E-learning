import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/hooks/use-courses";
import { CourseCard } from "@/components/CourseCard";
import { ArrowRight, BookOpen, Users, Trophy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { data: courses, isLoading } = useCourses();
  const featuredCourses = courses?.slice(0, 3) || [];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] dark:bg-grid-slate-400/[0.05]" />
        
        <div className="container relative mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              New courses available now
            </span>
            <h1 className="font-display font-bold text-5xl md:text-7xl tracking-tight mb-6 text-foreground">
              Master new skills <br />
              <span className="text-gradient">unlock your potential</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              Join thousands of learners worldwide. Access premium courses in coding, design, business, and more. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/courses">
                <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/25">
                  Browse Courses
                </Button>
              </Link>
              <Link href="/signup">
                <Button variant="outline" size="lg" className="h-12 px-8 text-base">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { icon: Users, label: "Active Students", value: "10k+" },
              { icon: BookOpen, label: "Total Courses", value: "200+" },
              { icon: Trophy, label: "Instructors", value: "50+" },
              { icon: CheckCircle, label: "Completion Rate", value: "94%" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <div className="p-3 bg-background rounded-full shadow-sm mb-3">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-2xl font-display">{stat.value}</h3>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="font-display font-bold text-3xl md:text-4xl mb-4">Featured Courses</h2>
              <p className="text-muted-foreground text-lg">Hand-picked by our expert team</p>
            </div>
            <Link href="/courses">
              <Button variant="ghost" className="hidden sm:flex group">
                View All <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-[400px] bg-muted/20 animate-pulse rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
          
          <div className="mt-8 text-center sm:hidden">
            <Link href="/courses">
              <Button variant="outline" className="w-full">View All Courses</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=2000&q=80')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        {/* Descriptive comment: Group of people working together on laptops */}
        
        <div className="container relative mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-3xl md:text-5xl mb-6">Ready to start learning?</h2>
          <p className="text-primary-foreground/80 text-lg max-w-2xl mx-auto mb-10">
            Join our community today and get unlimited access to all courses, projects, and certification programs.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="h-14 px-8 text-lg text-primary font-bold">
              Create Free Account
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
