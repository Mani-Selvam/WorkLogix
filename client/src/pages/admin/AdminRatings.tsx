import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { Rating, User } from "@shared/schema";

export default function AdminRatings() {
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: allRatings = [] } = useQuery<Rating[]>({
    queryKey: ['/api/ratings'],
  });

  const getUserNameById = (userId: number) => {
    const user = users.find(u => u.id === userId);
    return user?.displayName || "Unknown User";
  };

  const getRatingStars = (rating: string) => {
    const starCount = {
      'Excellent': 5,
      'Very Good': 4,
      'Good': 3,
      'Average': 2,
      'Needs Improvement': 1,
    }[rating] || 0;
    
    return '⭐'.repeat(starCount);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
          <Star className="h-6 w-6 sm:h-8 sm:w-8" />
          Performance Ratings
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          View all user ratings and feedback
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">All Ratings ({allRatings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {allRatings.length > 0 ? (
            <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
              {allRatings.map((rating) => (
                <Card key={rating.id} data-testid={`rating-${rating.id}`}>
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm sm:text-base truncate">{getUserNameById(rating.userId)}</h4>
                        <p className="text-xs sm:text-sm text-muted-foreground">
                          {format(new Date(rating.createdAt), "MMM dd, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {rating.period}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{getRatingStars(rating.rating)}</span>
                        <span className="text-xs sm:text-sm font-medium">{rating.rating}</span>
                      </div>
                      {rating.feedback && (
                        <p className="text-xs sm:text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                          {rating.feedback}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No ratings yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
