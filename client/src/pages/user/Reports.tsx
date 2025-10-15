import { useAuth } from "@/contexts/AuthContext";
import TimeBasedForm from "@/components/TimeBasedForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sunrise, Moon } from "lucide-react";

export default function Reports() {
  const { user, dbUserId } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold">Submit Reports</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Morning (9:30-11:30 AM) or Evening (6:30-11:30 PM)</p>
      </div>

      {user && dbUserId && (
        <Tabs defaultValue="morning" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
            <TabsTrigger value="morning" className="flex items-center gap-2">
              <Sunrise className="h-4 w-4" />
              <span className="hidden sm:inline">Morning Report</span>
              <span className="sm:hidden">Morning</span>
            </TabsTrigger>
            <TabsTrigger value="evening" className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span className="hidden sm:inline">Evening Report</span>
              <span className="sm:hidden">Evening</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="morning">
            <TimeBasedForm 
              type="morning"
              userName={user.displayName || ""}
              userId={dbUserId}
            />
          </TabsContent>
          <TabsContent value="evening">
            <TimeBasedForm 
              type="evening"
              userName={user.displayName || ""}
              userId={dbUserId}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
