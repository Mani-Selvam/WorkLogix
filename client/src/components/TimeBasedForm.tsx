import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sunrise, Moon, Upload } from "lucide-react";
import { useState } from "react";

interface TimeBasedFormProps {
  type: "morning" | "evening";
  userName: string;
  onSubmit?: (data: any) => void;
}

export default function TimeBasedForm({ type, userName, onSubmit }: TimeBasedFormProps) {
  const [formData, setFormData] = useState({
    plannedTasks: "",
    completedTasks: "",
    pendingTasks: "",
    notes: "",
    screenshot: null as File | null,
  });

  const isMorning = type === "morning";
  const greeting = isMorning ? "Good Morning" : "Good Evening";
  const Icon = isMorning ? Sunrise : Moon;
  const gradientClass = isMorning
    ? "bg-gradient-to-r from-[hsl(var(--morning-gradient-from))] to-[hsl(var(--morning-gradient-to))]"
    : "bg-gradient-to-r from-[hsl(var(--evening-gradient-from))] to-[hsl(var(--evening-gradient-to))]";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(`${type} form submitted:`, formData);
    onSubmit?.(formData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, screenshot: e.target.files[0] });
      console.log("File selected:", e.target.files[0].name);
    }
  };

  return (
    <Card className="overflow-hidden" data-testid={`form-${type}`}>
      <div className={`${gradientClass} opacity-15 h-24`} />
      <CardHeader className="-mt-16 relative">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-card rounded-lg shadow-sm">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {greeting} {userName}!
            </h2>
            <p className="text-sm text-muted-foreground">
              {isMorning
                ? "Please enter your planned tasks for today"
                : "Please enter your completed work for today"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isMorning ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="planned-tasks">Planned Tasks *</Label>
                <Textarea
                  id="planned-tasks"
                  placeholder="List your tasks for today..."
                  className="min-h-32 resize-none"
                  value={formData.plannedTasks}
                  onChange={(e) => setFormData({ ...formData, plannedTasks: e.target.value })}
                  data-testid="input-planned-tasks"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes / Comments</Label>
                <Textarea
                  id="notes"
                  placeholder="Any additional notes..."
                  className="min-h-24 resize-none"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  data-testid="input-notes"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="completed-tasks">Completed Tasks *</Label>
                <Textarea
                  id="completed-tasks"
                  placeholder="What did you complete today..."
                  className="min-h-32 resize-none"
                  value={formData.completedTasks}
                  onChange={(e) => setFormData({ ...formData, completedTasks: e.target.value })}
                  data-testid="input-completed-tasks"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pending-tasks">Pending Tasks</Label>
                <Textarea
                  id="pending-tasks"
                  placeholder="Tasks that are still pending..."
                  className="min-h-24 resize-none"
                  value={formData.pendingTasks}
                  onChange={(e) => setFormData({ ...formData, pendingTasks: e.target.value })}
                  data-testid="input-pending-tasks"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="screenshot">Screenshot Upload (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover-elevate cursor-pointer">
              <input
                type="file"
                id="screenshot"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                data-testid="input-screenshot"
              />
              <label htmlFor="screenshot" className="cursor-pointer flex flex-col items-center gap-2">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {formData.screenshot ? formData.screenshot.name : "Click to upload screenshot"}
                </p>
              </label>
            </div>
          </div>

          <Button type="submit" className="w-full" size="lg" data-testid="button-submit-report">
            Submit Report
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
