import { CalendarClock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function Page() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Card className="max-w-md">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <CalendarClock className="h-8 w-8 text-[var(--color-muted)]" />
          <h1 className="text-base font-semibold text-foreground">Attendance and Leaves Monitoring System</h1>
          <p className="text-sm text-[var(--color-muted)]">Daily time records, leave credits, and leave applications. Coming soon.</p>
        </CardContent>
      </Card>
    </div>
  );
}
