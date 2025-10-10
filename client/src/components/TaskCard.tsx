import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";

interface TaskCardProps {
  id: string;
  title: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  deadline?: Date;
  status: "Pending" | "In Progress" | "Completed";
  assignedDate: Date;
  onStatusChange?: (status: "Pending" | "In Progress" | "Completed") => void;
}

const priorityColors = {
  Low: "bg-muted text-muted-foreground",
  Medium: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  High: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const statusColors = {
  Pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  "In Progress": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  Completed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

export default function TaskCard({
  id,
  title,
  description,
  priority,
  deadline,
  status,
  assignedDate,
  onStatusChange,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);

  const handleStatusChange = () => {
    const statusFlow: Record<string, "Pending" | "In Progress" | "Completed"> = {
      Pending: "In Progress",
      "In Progress": "Completed",
      Completed: "Completed",
    };
    const newStatus = statusFlow[currentStatus];
    setCurrentStatus(newStatus);
    onStatusChange?.(newStatus);
    console.log(`Task ${id} status changed to ${newStatus}`);
  };

  return (
    <Card
      className={`border-l-4 ${
        priority === "High"
          ? "border-l-red-500"
          : priority === "Medium"
          ? "border-l-amber-500"
          : "border-l-muted-foreground"
      }`}
      data-testid={`card-task-${id}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-lg">{title}</CardTitle>
            <CardDescription className="mt-1 text-xs font-mono">
              Assigned {format(assignedDate, "MMM dd, yyyy")}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={priorityColors[priority]} data-testid={`badge-priority-${id}`}>
              {priority}
            </Badge>
            <Badge className={statusColors[currentStatus]} data-testid={`badge-status-${id}`}>
              {currentStatus}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {deadline && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="font-mono">Due: {format(deadline, "MMM dd, yyyy")}</span>
          </div>
        )}
        
        {expanded && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            data-testid={`button-expand-${id}`}
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                More
              </>
            )}
          </Button>
          
          {currentStatus !== "Completed" && (
            <Button
              size="sm"
              onClick={handleStatusChange}
              data-testid={`button-mark-progress-${id}`}
            >
              {currentStatus === "Pending" ? "Start Task" : "Mark Complete"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
