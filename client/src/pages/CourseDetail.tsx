import { useRoute, Link } from "wouter";
import { useCourse } from "@/hooks/use-courses";
import { useEnroll } from "@/hooks/use-enrollments";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, PlayCircle, Lock, CheckCircle, Clock, Award } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function CourseDetail() {
  const [match, params] = useRoute("/courses/:slug");
  const slug = params?.slug || "";
  
  const { data: course, isLoading } = useCourse(slug);
  const { mutate: enroll, isPending: isEnrolling } = useEnroll();
  const { user } = useAuth();
  
  // Safely check enrollment status if user exists
  const isEnrolled = false; // We would check this against fetched enrollments or a property on the course response

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">Course not found</h1>
        <Link href="/courses">
          <Button>Back to Courses</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header */}
      <div className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/20 mix-blend-overlay" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl">
            <div className="flex gap-2 mb-6">
              <Badge className="bg-primary hover:bg-primary/90 text-white border-0">
                {course.category}
              </Badge>
              <Badge variant="outline" className="text-white border-white/30">
                {course.difficulty}
              </Badge>
            </div>
            
            <h1 className="font-display font-bold text-3xl md:text-5xl mb-6 leading-tight">
              {course.title}
            </h1>
            
            <p className="text-lg text-slate-300 mb-8 max-w-2xl leading-relaxed">
              {course.description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Clock className="w-4 h-4" />
                <span>Last updated {new Date(course.createdAt || "").toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Award className="w-4 h-4" />
                <span>Certificate of completion</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-bold text-xl mb-4">What you'll learn</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((_, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">Master the fundamental concepts and advanced techniques in this field.</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="curriculum">
              <TabsList className="w-full justify-start h-12 bg-transparent border-b rounded-none p-0 mb-6">
                <TabsTrigger value="curriculum" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base">Instructor</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 text-base">Reviews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="curriculum">
                <div className="border rounded-xl overflow-hidden">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="section-1" className="border-none">
                      <AccordionTrigger className="px-6 hover:bg-muted/50">
                        <span className="font-medium text-lg">Course Content</span>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        {course.lessons?.map((lesson, idx) => (
                          <div key={lesson.id} className="flex items-center justify-between p-4 border-t px-6 hover:bg-muted/30 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium text-sm text-foreground">{lesson.title}</span>
                                <span className="text-xs text-muted-foreground">Video • 10 mins</span>
                              </div>
                            </div>
                            {isEnrolled ? (
                              <Link href={`/learn/${course.slug}/${lesson.id}`}>
                                <Button size="sm" variant="ghost" className="text-primary hover:text-primary/80">
                                  <PlayCircle className="w-4 h-4 mr-2" />
                                  Play
                                </Button>
                              </Link>
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>
              
              <TabsContent value="instructor">
                <div className="p-6 border rounded-xl bg-card">
                  <p className="text-muted-foreground">Instructor details would appear here.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="relative">
            <Card className="sticky top-24 overflow-hidden shadow-lg border-border/60">
              <div className="aspect-video bg-muted relative">
                {course.thumbnailUrl && (
                  <img 
                    src={course.thumbnailUrl} 
                    alt={course.title}
                    className="w-full h-full object-cover" 
                  />
                )}
                {!isEnrolled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
                    <PlayCircle className="w-16 h-16 text-white/80" />
                  </div>
                )}
              </div>
              
              <CardContent className="p-6">
                <div className="text-3xl font-bold mb-6 flex items-baseline gap-2">
                  ₹{Math.floor(Number(course.price)).toLocaleString('en-IN')}
                  <span className="text-base font-normal text-muted-foreground line-through">
                    ₹{Math.floor(Number(course.price) * 1.5).toLocaleString('en-IN')}
                  </span>
                </div>
                
                {user ? (
                  isEnrolled ? (
                    <Link href={`/dashboard`}>
                      <Button className="w-full h-12 text-lg font-semibold mb-4">
                        Go to Dashboard
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full h-12 text-lg font-semibold mb-4 shadow-lg shadow-primary/25"
                      onClick={() => enroll(course.id)}
                      disabled={isEnrolling}
                    >
                      {isEnrolling ? "Enrolling..." : "Enroll Now"}
                    </Button>
                  )
                ) : (
                  <Link href="/login">
                    <Button className="w-full h-12 text-lg font-semibold mb-4">
                      Login to Enroll
                    </Button>
                  </Link>
                )}
                
                <p className="text-xs text-center text-muted-foreground mb-6">
                  30-Day Money-Back Guarantee
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Access</span>
                    <span className="font-medium">Lifetime</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Certification</span>
                    <span className="font-medium">Yes</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-medium">{course.difficulty}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
