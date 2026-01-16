import { useEnrollments } from "@/hooks/use-enrollments";
import { useAuth } from "@/hooks/use-auth";
import { CourseCard } from "@/components/CourseCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Loader2, Award, Clock, BookOpen } from "lucide-react";
import { Link } from "wouter";
import type { CourseWithLessons } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: enrollments, isLoading } = useEnrollments();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Calculate stats
  const totalCourses = enrollments?.length || 0;
  const completedCourses = enrollments?.filter(e => {
    // Basic check - if all lessons complete (simplified logic)
    const course = e.course as CourseWithLessons;
    const totalLessons = course.lessons?.length || 0;
    const completedLessons = Object.values(e.progress || {}).filter(Boolean).length;
    return totalLessons > 0 && completedLessons === totalLessons;
  }).length || 0;

  return (
    <div className="min-h-screen bg-muted/10 pb-20">
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 py-10">
          <h1 className="font-display font-bold text-3xl mb-2">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground">Track your progress and continue learning.</p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedCourses}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 gap-1">
              <CardTitle className="text-sm font-medium">Hours Learned</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12.5</div>
            </CardContent>
          </Card>
        </div>

        <h2 className="font-display font-bold text-2xl mb-6">My Courses</h2>
        
        {enrollments?.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-dashed">
            <h3 className="font-bold text-xl mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-6">Start your learning journey today.</p>
            <Link href="/courses">
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                Browse Catalog
              </button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments?.map((enrollment) => {
              // Calculate progress percentage
              const course = enrollment.course as CourseWithLessons;
              const progressMap = enrollment.progress || {};
              const completedCount = Object.values(progressMap).filter(Boolean).length;
              const totalLessons = course.lessons?.length || 1; // Avoid div by zero
              const percent = Math.round((completedCount / totalLessons) * 100);

              return (
                <div key={enrollment.id} className="flex flex-col h-full">
                  <CourseCard course={course} />
                  <div className="mt-[-1rem] mx-4 relative z-10 bg-card p-4 rounded-b-xl border-x border-b shadow-sm pt-6">
                    <div className="flex justify-between text-xs font-medium mb-2">
                      <span>{percent}% Complete</span>
                      <span>{completedCount}/{totalLessons} Lessons</span>
                    </div>
                    <Progress value={percent} className="h-2" />
                    <Link href={`/courses/${course.slug}`} className="block mt-4">
                      <button className="w-full py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors">
                        Continue Learning
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
