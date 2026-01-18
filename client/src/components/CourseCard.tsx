import { Link } from "wouter";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, BookOpen } from "lucide-react";
import type { Course, Lesson } from "@shared/schema";

interface CourseCardProps {
  course: Course & { lessons?: Lesson[] };
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80";

export function CourseCard({ course }: CourseCardProps) {
  return (
    <Card className="overflow-hidden card-hover h-full flex flex-col group border-border/50">
      <div className="h-48 min-h-[12rem] relative overflow-hidden bg-muted">
        {course.thumbnailUrl ? (
          <img
            src={course.thumbnailUrl}
            alt={course.title}
            className="h-full w-full object-cover block"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
            onError={(e) => {
              const img = e.currentTarget;
              if (img.src !== FALLBACK_IMG) {
                img.src = FALLBACK_IMG; // ✅ fallback if this particular image fails
              }
            }}
          />
        ) : (
          <img
            src={FALLBACK_IMG}
            alt={course.title}
            className="h-full w-full object-cover block"
            loading="eager"
            decoding="async"
            referrerPolicy="no-referrer"
            draggable={false}
          />
        )}

        <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />

        <Badge className="absolute top-4 right-4 bg-white/90 text-foreground backdrop-blur-sm shadow-sm hover:bg-white">
          {course.category}
        </Badge>
      </div>

      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge
            variant="outline"
            className="text-xs font-normal text-muted-foreground border-primary/20 bg-primary/5"
          >
            {course.difficulty}
          </Badge>
          <span className="font-bold text-lg text-primary">
            ₹{Math.floor(Number(course.price)).toLocaleString("en-IN")}
          </span>
        </div>

        <h3 className="font-display font-bold text-xl leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {course.title}
        </h3>
      </CardHeader>

      <CardContent className="flex-grow">
        <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
          {course.description}
        </p>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{course.lessons?.length || 0} Lessons</span>
          </div>
          <div className="flex items-center gap-1">
            <BarChart className="w-3.5 h-3.5" />
            <span>{course.difficulty}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <Link href={`/courses/${course.slug}`} className="w-full">
          <Button className="w-full group-hover:bg-primary/90 transition-all">
            View Course
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
