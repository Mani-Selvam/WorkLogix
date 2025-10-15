import { useAuth } from "@/contexts/AuthContext";
import TimeBasedForm from "@/components/TimeBasedForm";

export default function Reports() {
  const { user, dbUserId } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Submit Reports</h2>
        <p className="text-muted-foreground mt-1">Morning (9:30-11:30 AM) or Evening (6:30-11:30 PM)</p>
      </div>

      {user && dbUserId && (
        <div className="grid gap-8 lg:grid-cols-2">
          <TimeBasedForm 
            type="morning"
            userName={user.displayName || ""}
            userId={dbUserId}
          />
          <TimeBasedForm 
            type="evening"
            userName={user.displayName || ""}
            userId={dbUserId}
          />
        </div>
      )}
    </div>
  );
}
