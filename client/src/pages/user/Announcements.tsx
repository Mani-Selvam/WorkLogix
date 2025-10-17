import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { Megaphone } from "lucide-react";
import type { GroupMessage } from "@shared/schema";

export default function Announcements() {
  const { data: announcements = [], isLoading } = useQuery<GroupMessage[]>({
    queryKey: ['/api/group-messages'],
    queryFn: async () => {
      const user = localStorage.getItem('user');
      const userId = user ? JSON.parse(user).id : null;
      const headers: Record<string, string> = {};
      if (userId) {
        headers["x-user-id"] = userId.toString();
      }
      
      const res = await fetch('/api/group-messages', { headers, credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch announcements');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Announcements</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Group messages from admin</p>
      </div>

      {announcements.length > 0 ? (
        <div className="space-y-4">
          {announcements.map(announcement => (
            <Card key={announcement.id} data-testid={`card-announcement-${announcement.id}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Megaphone className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    {announcement.title && (
                      <CardTitle className="text-lg mb-2">{announcement.title}</CardTitle>
                    )}
                    <p className="text-sm text-muted-foreground font-mono">
                      {format(new Date(announcement.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{announcement.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No announcements yet
        </div>
      )}
    </div>
  );
}
