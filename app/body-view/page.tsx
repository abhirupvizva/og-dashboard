"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function normalizeBody(body?: string) {
  if (!body) return "";
  return body.replace(/\r\n/g, "\n").trim();
}

type BodyDoc = {
  _id: string;
  subject?: string;
  body?: string;
  sender?: string;
  to?: string;
  cc?: string;
  receivedDateTime?: string;
  ["Candidate Name"]?: string;
  ["End Client"]?: string;
};

function toTimestamp(dateTime?: string) {
  if (!dateTime) return Number.NEGATIVE_INFINITY;
  const t = Date.parse(dateTime);
  return Number.isFinite(t) ? t : Number.NEGATIVE_INFINITY;
}

function formatToEST(dateTime?: string) {
  if (!dateTime) return "";
  const t = Date.parse(dateTime);
  if (!Number.isFinite(t)) return dateTime;
  const date = new Date(t);
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
  return `${formatted} EST`;
}

export default function BodyViewPage() {
  const [subject, setSubject] = useState("");
  const [rows, setRows] = useState<BodyDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const fetchBySubject = useCallback(async (value: string) => {
    const q = value.trim();
    if (!q) {
      setRows([]);
      setOpenItems({});
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      params.append("search", q);
      params.append("page", "1");
      params.append("limit", "50");

      const res = await fetch(`/api/interviews?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();

      const mapped = (data.interviews || [])
        .filter((i: any) => typeof i?.body === "string" && i.body.trim())
        .map(
          (i: any) =>
            ({
              _id: i._id,
              subject: i.subject,
              body: i.body,
              sender: i.sender,
              to: i.to,
              cc: i.cc,
              receivedDateTime: i.receivedDateTime,
              ["Candidate Name"]: i["Candidate Name"],
              ["End Client"]: i["End Client"],
            }) satisfies BodyDoc,
        );

      const items = (mapped as BodyDoc[]).sort(
        (a: BodyDoc, b: BodyDoc) =>
          toTimestamp(b.receivedDateTime) - toTimestamp(a.receivedDateTime),
      );

      setRows(items);
      setOpenItems({});
    } catch {
      setRows([]);
      setOpenItems({});
      setError("Failed to load body from database");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBySubject(subject);
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchBySubject, subject]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Body View
          </h1>
          <p className="text-muted-foreground">
            Search by subject, then open the item to read the email body.
          </p>
        </div>

        <Card className="bg-card border-border shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex-1">
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Search by subject..."
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSubject("");
                    setRows([]);
                    setOpenItems({});
                    setError(null);
                  }}>
                  Clear
                </Button>
              </div>
            </div>

            <div className="mt-3 text-xs text-muted-foreground">
              {loading ? "Searching..." : `${rows.length} items`}
            </div>
            {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {loading && rows.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-lg border border-border border-dashed shadow-sm">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-12 text-center bg-card rounded-lg border border-border border-dashed shadow-sm">
              <p className="text-muted-foreground">
                {subject.trim()
                  ? "No body found for this subject."
                  : "Type a subject to search."}
              </p>
            </div>
          ) : (
            rows.map((row) => (
              <Card
                key={row._id}
                className="bg-card border-border overflow-hidden">
                <Collapsible
                  open={openItems[row._id]}
                  onOpenChange={() => toggleItem(row._id)}>
                  <CollapsibleTrigger asChild>
                    <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className="flex flex-col gap-1 overflow-hidden">
                        <h3 className="text-base font-semibold text-foreground truncate">
                          {row.subject || "No Subject"}
                        </h3>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                          {row["Candidate Name"] ? (
                            <span>{row["Candidate Name"]}</span>
                          ) : null}
                          {row["End Client"] ? (
                            <span>{row["End Client"]}</span>
                          ) : null}
                          {row.receivedDateTime ? (
                            <span className="whitespace-nowrap">
                              {formatToEST(row.receivedDateTime)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        {openItems[row._id] ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="border-t border-border bg-muted/10 p-4 space-y-4">
                      <div className="grid grid-cols-[60px_1fr] gap-2 text-sm">
                        <span className="text-muted-foreground font-medium">
                          From:
                        </span>
                        <span className="text-foreground break-all">
                          {row.sender || "Unknown"}
                        </span>

                        <span className="text-muted-foreground font-medium">
                          To:
                        </span>
                        <span className="text-foreground break-all">
                          {row.to || "Unknown"}
                        </span>

                        <span className="text-muted-foreground font-medium">
                          CC:
                        </span>
                        <span className="text-foreground break-all">
                          {row.cc || "None"}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground whitespace-pre-wrap font-mono bg-muted/30 p-3 rounded-md max-h-[300px] overflow-y-auto">
                        {normalizeBody(row.body) || "No content"}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
