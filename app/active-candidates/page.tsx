"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ArrowUpDown, Download } from "lucide-react";
import DashboardLayout from "@/components/dashboard-layout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMockMembersForTeam, MOCK_TEAMS } from "@/src/data/mock-teams";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type CandidateRow = {
  id: string;
  candidateName: string;
  branch: string;
  expert: string;
  recruiter: string;
  status: string;
  team: string;
};

type ApiResponse = {
  candidates: CandidateRow[];
  refreshedAt: string;
  teams?: {
    ok: boolean;
    error?: string | null;
    dbName?: string;
    collection?: string;
  };
};

type SortKey = "candidateName" | "branch" | "expert" | "recruiter" | "status";

function norm(v: string) {
  return (v || "").trim().toLowerCase();
}

function formatTime(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  return d.toLocaleString();
}

function csvEscape(v: unknown) {
  const s = (v ?? "").toString();
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toggleValue(selected: string[], value: string) {
  if (selected.includes(value)) return selected.filter((v) => v !== value);
  return [...selected, value];
}

function filterLabel(
  label: string,
  selected: string[],
  valueToLabel?: (v: string) => string,
) {
  if (selected.length === 0) return `${label}: All`;
  if (selected.length === 1)
    return `${label}: ${valueToLabel ? valueToLabel(selected[0]) : selected[0]}`;
  return `${label}: ${selected.length} selected`;
}

export default function ActiveCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamsWarning, setTeamsWarning] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState<string>("");

  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState<string[]>([]);
  const [teamMemberFilter, setTeamMemberFilter] = useState<string[]>([]);
  const [branchFilter, setBranchFilter] = useState<string[]>([]);
  const [expertFilter, setExpertFilter] = useState<string[]>([]);
  const [recruiterFilter, setRecruiterFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const [sortKey, setSortKey] = useState<SortKey>("candidateName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const abortRef = useRef<AbortController | null>(null);
  const pollRef = useRef<number | null>(null);

  const fetchCandidates = useCallback(
    async (mode: "initial" | "refresh" = "refresh") => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;

      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setError(null);

      try {
        const res = await fetch(`/api/active-candidates?limit=1000`, {
          cache: "no-store",
          signal: ac.signal,
        });
        if (!res.ok) throw new Error("Failed to fetch active candidates");
        const data = (await res.json()) as ApiResponse;
        setCandidates(Array.isArray(data.candidates) ? data.candidates : []);
        setRefreshedAt(data.refreshedAt || "");
        setTeamsWarning(data.teams?.error ? data.teams.error : null);
      } catch (e) {
        if ((e as any)?.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "An error occurred");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    fetchCandidates("initial");
    pollRef.current = window.setInterval(() => {
      fetchCandidates("refresh");
    }, 10_000);
    return () => {
      abortRef.current?.abort();
      if (pollRef.current) window.clearInterval(pollRef.current);
    };
  }, [fetchCandidates]);

  const options = useMemo(() => {
    const branches = new Set<string>();
    const experts = new Set<string>();
    const recruiters = new Set<string>();
    const statuses = new Set<string>();
    const teams = new Set<string>();

    for (const c of candidates) {
      if (c.branch) branches.add(c.branch);
      if (c.expert) experts.add(c.expert);
      if (c.recruiter) recruiters.add(c.recruiter);
      if (c.status) statuses.add(c.status);
      if (c.team) teams.add(c.team);
    }

    const sort = (a: string, b: string) =>
      a.localeCompare(b, undefined, { sensitivity: "base" });

    return {
      branches: Array.from(branches).sort(sort),
      experts: Array.from(experts).sort(sort),
      recruiters: Array.from(recruiters).sort(sort),
      statuses: Array.from(statuses).sort(sort),
      teams: Array.from(teams).sort(sort),
    };
  }, [candidates]);

  const teamMembers = useMemo(() => {
    const members =
      teamFilter.length === 0
        ? MOCK_TEAMS.flatMap((t) =>
            t.members.map((m) => ({ ...m, team_name: t.team_name })),
          )
        : teamFilter.flatMap((t) =>
            getMockMembersForTeam(t).map((m) => ({ ...m, team_name: t })),
          );

    const byEmail = new Map<
      string,
      { name: string; email: string; team_name: string }
    >();
    for (const m of members) {
      const email = norm(m.email);
      if (!email) continue;
      if (!byEmail.has(email))
        byEmail.set(email, {
          name: m.name,
          email: m.email,
          team_name: m.team_name,
        });
    }

    const list = Array.from(byEmail.values());
    list.sort((a, b) =>
      (a.name || "").localeCompare(b.name || "", undefined, {
        sensitivity: "base",
      }),
    );
    return list;
  }, [teamFilter]);

  useEffect(() => {
    if (teamMemberFilter.length === 0) return;
    const allowed = new Set(teamMembers.map((m) => norm(m.email)));
    const next = teamMemberFilter.filter((e) => allowed.has(norm(e)));
    if (next.length !== teamMemberFilter.length) setTeamMemberFilter(next);
  }, [teamFilter, teamMemberFilter, teamMembers]);

  const filtered = useMemo(() => {
    const q = norm(search);
    return candidates.filter((c) => {
      if (q) {
        const hay = `${c.candidateName} ${c.branch} ${c.expert} ${c.recruiter} ${c.status} ${c.team}`;
        if (!norm(hay).includes(q)) return false;
      }
      if (teamFilter.length > 0 && !teamFilter.includes(c.team)) return false;
      if (branchFilter.length > 0 && !branchFilter.includes(c.branch))
        return false;
      if (expertFilter.length > 0 && !expertFilter.includes(c.expert))
        return false;
      if (recruiterFilter.length > 0 && !recruiterFilter.includes(c.recruiter))
        return false;
      if (statusFilter.length > 0 && !statusFilter.includes(c.status))
        return false;

      if (teamMemberFilter.length > 0) {
        const expert = norm(c.expert);
        const recruiter = norm(c.recruiter);
        const ok = teamMemberFilter.some((email) => {
          const e = norm(email);
          if (!e) return false;
          const member = teamMembers.find((m) => norm(m.email) === e);
          const nm = member ? norm(member.name) : "";
          return (
            (e && (expert.includes(e) || recruiter.includes(e))) ||
            (nm && (expert.includes(nm) || recruiter.includes(nm)))
          );
        });
        if (!ok) return false;
      }
      return true;
    });
  }, [
    branchFilter,
    candidates,
    expertFilter,
    recruiterFilter,
    search,
    statusFilter,
    teamFilter,
    teamMemberFilter,
    teamMembers,
  ]);

  const grouped = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    const cmp = (a: CandidateRow, b: CandidateRow) => {
      const av = (a[sortKey] || "").toString();
      const bv = (b[sortKey] || "").toString();
      return av.localeCompare(bv, undefined, { sensitivity: "base" }) * dir;
    };

    const byTeam: Record<string, CandidateRow[]> = {};
    for (const c of filtered) {
      const t = c.team || "Unassigned";
      if (!byTeam[t]) byTeam[t] = [];
      byTeam[t].push(c);
    }

    const teamNames = Object.keys(byTeam).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
    return teamNames.map((team) => ({
      team,
      items: byTeam[team]
        .slice()
        .sort(
          (a, b) => cmp(a, b) || a.candidateName.localeCompare(b.candidateName),
        ),
    }));
  }, [filtered, sortDir, sortKey]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCsv = useCallback(() => {
    const rows = grouped.flatMap((g) => g.items);
    const headers = [
      "candidate name",
      "branch",
      "expert",
      "recruiter",
      "current status",
      "team",
    ];
    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          csvEscape(r.candidateName),
          csvEscape(r.branch),
          csvEscape(r.expert),
          csvEscape(r.recruiter),
          csvEscape(r.status),
          csvEscape(r.team),
        ].join(","),
      ),
    ];

    const stamp = refreshedAt ? new Date(refreshedAt) : new Date();
    const safeStamp = Number.isFinite(stamp.getTime())
      ? stamp.toISOString().replace(/[:]/g, "-").replace(".000Z", "Z")
      : new Date().toISOString().replace(/[:]/g, "-").replace(".000Z", "Z");
    const filename = `active-candidates-${safeStamp}.csv`;

    const blob = new Blob([lines.join("\r\n")], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, [grouped, refreshedAt]);

  const MultiSelect = ({
    label,
    widthClassName,
    values,
    selected,
    onChange,
    valueToLabel,
  }: {
    label: string;
    widthClassName: string;
    values: { value: string; label: string }[];
    selected: string[];
    onChange: (next: string[]) => void;
    valueToLabel?: (v: string) => string;
  }) => {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${widthClassName} justify-between`}>
            <span className="truncate">
              {filterLabel(label, selected, valueToLabel)}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[360px]">
          <DropdownMenuLabel>{label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              onChange([]);
            }}>
            Clear
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {values.map((v) => (
            <DropdownMenuCheckboxItem
              key={v.value}
              checked={selected.includes(v.value)}
              onCheckedChange={() => onChange(toggleValue(selected, v.value))}>
              {v.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 w-full max-w-[1920px] mx-auto">
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Active Candidates
              </h1>
              <p className="text-muted-foreground">
                Real-time view of active candidates enriched with team
                assignments.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {teamsWarning ? (
                <Badge
                  variant="outline"
                  className="border-amber-500/40 text-amber-500">
                  Teams unavailable
                </Badge>
              ) : null}
              <div className="text-xs text-muted-foreground hidden sm:block">
                {refreshedAt ? `Last updated: ${formatTime(refreshedAt)}` : ""}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchCandidates("refresh")}
                disabled={refreshing}>
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>
        </div>

        <Card className="border-border bg-card">
          <CardHeader className="pb-3">
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter and sort candidates by team and assignment.
            </CardDescription>
            <div className="flex flex-wrap items-end gap-3 mt-3">
              <div className="flex flex-col gap-2 w-[260px]">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search candidates..."
                />
              </div>

              <MultiSelect
                label="Team"
                widthClassName="w-[200px]"
                values={options.teams.map((t) => ({ value: t, label: t }))}
                selected={teamFilter}
                onChange={setTeamFilter}
              />

              <MultiSelect
                label="Team Member"
                widthClassName="w-[260px]"
                values={teamMembers.map((m) => ({
                  value: m.email,
                  label: `${m.name} (${m.email})`,
                }))}
                selected={teamMemberFilter}
                onChange={setTeamMemberFilter}
                valueToLabel={(v) =>
                  teamMembers.find((m) => norm(m.email) === norm(v))?.name || v
                }
              />

              <MultiSelect
                label="Branch"
                widthClassName="w-[180px]"
                values={options.branches.map((b) => ({ value: b, label: b }))}
                selected={branchFilter}
                onChange={setBranchFilter}
              />

              <MultiSelect
                label="Expert"
                widthClassName="w-[220px]"
                values={options.experts.map((x) => ({ value: x, label: x }))}
                selected={expertFilter}
                onChange={setExpertFilter}
              />

              <MultiSelect
                label="Recruiter"
                widthClassName="w-[220px]"
                values={options.recruiters.map((x) => ({ value: x, label: x }))}
                selected={recruiterFilter}
                onChange={setRecruiterFilter}
              />

              <MultiSelect
                label="Status"
                widthClassName="w-[180px]"
                values={options.statuses.map((s) => ({ value: s, label: s }))}
                selected={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {error ? (
              <div className="p-4 rounded-md border border-border bg-background text-sm text-destructive flex items-center justify-between gap-3">
                <div>{error}</div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchCandidates("refresh")}>
                  Retry
                </Button>
              </div>
            ) : null}

            <div className="hidden md:block mt-4 overflow-x-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[280px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => toggleSort("candidateName")}>
                        Candidate <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => toggleSort("branch")}>
                        Branch <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[260px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => toggleSort("expert")}>
                        Expert <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[260px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => toggleSort("recruiter")}>
                        Recruiter <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                    <TableHead className="w-[180px]">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2"
                        onClick={() => toggleSort("status")}>
                        Status <ArrowUpDown className="h-4 w-4" />
                      </button>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : grouped.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No active candidates found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    grouped.flatMap((g) => {
                      const groupRows: React.ReactNode[] = [];
                      groupRows.push(
                        <TableRow key={`team-${g.team}`}>
                          <TableCell
                            colSpan={5}
                            className="bg-muted/40 font-semibold">
                            {g.team}{" "}
                            <span className="text-muted-foreground font-normal">
                              ({g.items.length})
                            </span>
                          </TableCell>
                        </TableRow>,
                      );
                      for (const c of g.items) {
                        groupRows.push(
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">
                              {c.candidateName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.branch || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.expert || "-"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {c.recruiter || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="bg-background">
                                {c.status || "-"}
                              </Badge>
                            </TableCell>
                          </TableRow>,
                        );
                      }
                      return groupRows;
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="md:hidden mt-4 space-y-4">
              {loading ? (
                <div className="p-4 text-sm text-muted-foreground">
                  Loading...
                </div>
              ) : grouped.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground">
                  No active candidates found.
                </div>
              ) : (
                grouped.map((g) => (
                  <div key={`team-cards-${g.team}`} className="space-y-3">
                    <div className="text-sm font-semibold text-foreground">
                      {g.team}{" "}
                      <span className="text-muted-foreground font-normal">
                        ({g.items.length})
                      </span>
                    </div>
                    {g.items.map((c) => (
                      <Card
                        key={`card-${c.id}`}
                        className="border-border bg-card">
                        <CardContent className="p-4 space-y-2">
                          <div className="flex items-start justify-between gap-3">
                            <div className="font-semibold">
                              {c.candidateName}
                            </div>
                            <Badge variant="outline" className="bg-background">
                              {c.status || "-"}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Branch</div>
                            <div className="text-foreground">
                              {c.branch || "-"}
                            </div>
                            <div className="text-muted-foreground">Expert</div>
                            <div className="text-foreground">
                              {c.expert || "-"}
                            </div>
                            <div className="text-muted-foreground">
                              Recruiter
                            </div>
                            <div className="text-foreground">
                              {c.recruiter || "-"}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
