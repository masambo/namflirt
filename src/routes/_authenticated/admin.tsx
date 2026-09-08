import { createFileRoute, Link } from "@tanstack/react-router";
import { useDeferredValue, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Activity,
  BadgeCheck,
  Ban,
  Check,
  ChevronRight,
  CircleAlert,
  Crown,
  Flag,
  HeartHandshake,
  LoaderCircle,
  MessageCircle,
  MoreHorizontal,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated/admin")({ component: AdminDashboard });

type AdminTab = "overview" | "members" | "reports";
type MemberStatus = "active" | "suspended" | "deleted";
type MemberPlan = "free" | "premium" | "vip";

interface AdminMember {
  _id: string;
  _creationTime: number;
  displayName: string;
  email?: string;
  photo?: string;
  town?: string;
  region?: string;
  completed: boolean;
  verified: boolean;
  plan: MemberPlan;
  status: MemberStatus;
  moderationNote?: string;
  lastActive: number;
  reportCount: number;
}

interface AdminOverview {
  metrics: {
    members: number;
    completed: number;
    newThisWeek: number;
    activeNow: number;
    activeToday: number;
    mutualMatches: number;
    conversations: number;
    messages: number;
    openReports: number;
    suspended: number;
    verified: number;
    demoProfiles: number;
  };
  plans: Record<MemberPlan, number>;
  activity: Array<{ date: string; members: number; messages: number }>;
  recentMembers: AdminMember[];
}

interface AdminReport {
  _id: string;
  reason: string;
  details?: string;
  status: "open" | "resolved" | "dismissed";
  createdAt: number;
  resolvedAt?: number;
  reporter: AdminMember;
  reported: AdminMember;
}

const tabs: Array<{ id: AdminTab; label: string; Icon: typeof Activity }> = [
  { id: "overview", label: "Overview", Icon: Activity },
  { id: "members", label: "Members", Icon: UsersRound },
  { id: "reports", label: "Reports", Icon: Flag },
];

function AdminDashboard() {
  const [tab, setTab] = useState<AdminTab>("overview");
  const access = useQuery(api.admin.access, {}) as { isAdmin: boolean; email?: string } | undefined;

  if (access === undefined) return <AdminLoading />;
  if (!access.isAdmin) return <AdminDenied />;

  return (
    <main className="min-h-screen bg-[#10100f] pb-24 lg:pb-10">
      <header className="border-b border-white/8 bg-[#131311]">
        <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-7 lg:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase text-white/40">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Operations
              </div>
              <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">Admin dashboard</h1>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-white/8 bg-white/[.025] px-3 py-2 text-xs text-white/45">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {access.email}
            </div>
          </div>
          <nav className="mt-5 flex gap-1 overflow-x-auto" aria-label="Admin sections">
            {tabs.map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-3.5 text-xs font-semibold transition ${
                  tab === id
                    ? "bg-white text-black"
                    : "text-white/45 hover:bg-white/[.05] hover:text-white"
                }`}
                aria-current={tab === id ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-7 lg:px-10 lg:py-8">
        {tab === "overview" ? <Overview /> : null}
        {tab === "members" ? <Members /> : null}
        {tab === "reports" ? <Reports /> : null}
      </div>
    </main>
  );
}

function Overview() {
  const overview = useQuery(api.admin.overview, {}) as AdminOverview | undefined;
  if (!overview) return <SectionLoading label="Loading activity" />;
  const { metrics } = overview;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Members"
          value={metrics.members}
          detail={`+${metrics.newThisWeek} this week`}
          Icon={UsersRound}
          tone="neutral"
        />
        <Metric
          label="Active today"
          value={metrics.activeToday}
          detail={`${metrics.activeNow} online now`}
          Icon={Activity}
          tone="green"
        />
        <Metric
          label="Mutual matches"
          value={metrics.mutualMatches}
          detail={`${metrics.conversations} conversations`}
          Icon={HeartHandshake}
          tone="pink"
        />
        <Metric
          label="Open reports"
          value={metrics.openReports}
          detail={`${metrics.suspended} suspended`}
          Icon={Flag}
          tone={metrics.openReports ? "amber" : "neutral"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.65fr_1fr]">
        <div className="admin-panel p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="admin-label">Seven-day activity</p>
              <h2 className="mt-1 text-lg font-semibold">Messages and new members</h2>
            </div>
            <MessageCircle className="h-4 w-4 text-white/25" />
          </div>
          <ActivityChart data={overview.activity} />
        </div>
        <div className="admin-panel p-5 sm:p-6">
          <p className="admin-label">Membership</p>
          <h2 className="mt-1 text-lg font-semibold">Plan distribution</h2>
          <div className="mt-6 space-y-5">
            <PlanRow
              label="Free"
              count={overview.plans.free}
              total={metrics.members}
              color="bg-white/35"
            />
            <PlanRow
              label="Premium"
              count={overview.plans.premium}
              total={metrics.members}
              color="bg-pink-400"
            />
            <PlanRow
              label="VIP"
              count={overview.plans.vip}
              total={metrics.members}
              color="bg-amber-300"
            />
          </div>
          <div className="mt-7 grid grid-cols-2 border-t border-white/8 pt-5">
            <SmallStat label="Verified" value={metrics.verified} />
            <SmallStat label="Complete" value={metrics.completed} />
          </div>
        </div>
      </section>

      <section className="admin-panel overflow-hidden">
        <SectionHeader label="Member activity" title="Recently joined" />
        <MemberTable members={overview.recentMembers} compact />
      </section>
    </div>
  );
}

function Members() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | MemberStatus>("all");
  const [plan, setPlan] = useState<"all" | MemberPlan>("all");
  const deferredSearch = useDeferredValue(search);
  const members = useQuery(api.admin.members, {
    search: deferredSearch || undefined,
    status,
    plan,
  }) as AdminMember[] | undefined;

  return (
    <section className="admin-panel overflow-hidden">
      <div className="border-b border-white/8 p-4 sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="admin-label">Directory</p>
            <h2 className="mt-1 text-lg font-semibold">Member management</h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative min-w-0 sm:w-72">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
              <span className="sr-only">Search members</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or town"
                className="admin-input w-full pl-9"
              />
            </label>
            <FilterSelect
              label="Status"
              value={status}
              onChange={(value) => setStatus(value as typeof status)}
              options={["all", "active", "suspended"]}
            />
            <FilterSelect
              label="Plan"
              value={plan}
              onChange={(value) => setPlan(value as typeof plan)}
              options={["all", "free", "premium", "vip"]}
            />
          </div>
        </div>
      </div>
      {members === undefined ? <SectionLoading label="Loading members" /> : null}
      {members?.length ? <MemberTable members={members} /> : null}
      {members && !members.length ? (
        <EmptyState
          Icon={Search}
          title="No members found"
          copy="Try a different search or filter."
        />
      ) : null}
    </section>
  );
}

function Reports() {
  const [status, setStatus] = useState<"all" | "open" | "resolved" | "dismissed">("open");
  const reports = useQuery(api.admin.reports, { status }) as AdminReport[] | undefined;
  const resolveReport = useMutation(api.admin.resolveReport);

  async function updateReport(reportId: string, next: "resolved" | "dismissed") {
    try {
      await resolveReport({ reportId, status: next });
      toast.success(next === "resolved" ? "Report resolved." : "Report dismissed.");
    } catch (error) {
      toast.error("Report not updated", { description: errorMessage(error) });
    }
  }

  return (
    <section className="admin-panel overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-white/8 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <p className="admin-label">Safety queue</p>
          <h2 className="mt-1 text-lg font-semibold">Member reports</h2>
        </div>
        <FilterSelect
          label="Report status"
          value={status}
          onChange={(value) => setStatus(value as typeof status)}
          options={["open", "resolved", "dismissed", "all"]}
        />
      </div>
      {reports === undefined ? <SectionLoading label="Loading reports" /> : null}
      {reports?.length ? (
        <div className="divide-y divide-white/8">
          {reports.map((report) => (
            <article
              key={report._id}
              className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[1.1fr_1fr_auto] xl:items-center"
            >
              <div className="flex min-w-0 gap-3">
                <Avatar member={report.reported} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{report.reported.displayName}</p>
                    <StatusBadge status={report.status} />
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Reported by {report.reporter.displayName} · {formatDate(report.createdAt)}
                  </p>
                  <p className="mt-2 text-xs font-semibold capitalize text-amber-200">
                    {reasonLabel(report.reason)}
                  </p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/55">
                {report.details || "No additional details were provided."}
              </p>
              {report.status === "open" ? (
                <div className="flex gap-2 xl:justify-end">
                  <button
                    onClick={() => void updateReport(report._id, "dismissed")}
                    className="admin-button-secondary"
                  >
                    <X className="h-3.5 w-3.5" /> Dismiss
                  </button>
                  <button
                    onClick={() => void updateReport(report._id, "resolved")}
                    className="admin-button-primary"
                  >
                    <Check className="h-3.5 w-3.5" /> Resolve
                  </button>
                </div>
              ) : (
                <p className="text-right text-xs text-white/30">
                  Closed {report.resolvedAt ? formatDate(report.resolvedAt) : ""}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : null}
      {reports && !reports.length ? (
        <EmptyState
          Icon={ShieldCheck}
          title="Queue is clear"
          copy="There are no reports in this view."
        />
      ) : null}
    </section>
  );
}

function MemberTable({ members, compact = false }: { members: AdminMember[]; compact?: boolean }) {
  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[780px] text-left">
          <thead className="border-b border-white/8 bg-white/[.018] text-[10px] font-semibold uppercase text-white/30">
            <tr>
              <th className="px-5 py-3">Member</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Last active</th>
              <th className="px-4 py-3">Reports</th>
              {compact ? null : <th className="px-5 py-3 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/8">
            {members.map((member) => (
              <tr key={member._id} className="transition hover:bg-white/[.018]">
                <td className="px-5 py-3.5">
                  <MemberIdentity member={member} />
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={member.status} />
                </td>
                <td className="px-4 py-3.5">
                  <PlanBadge plan={member.plan} />
                </td>
                <td className="px-4 py-3.5 text-xs text-white/45">
                  {relativeTime(member.lastActive)}
                </td>
                <td className="px-4 py-3.5 text-xs text-white/45">{member.reportCount || "—"}</td>
                {compact ? null : (
                  <td className="px-5 py-3.5 text-right">
                    <MemberActions member={member} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="divide-y divide-white/8 md:hidden">
        {members.map((member) => (
          <div key={member._id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <MemberIdentity member={member} />
              {compact ? <StatusBadge status={member.status} /> : <MemberActions member={member} />}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/35">
              <StatusBadge status={member.status} />
              <PlanBadge plan={member.plan} />
              <span>Active {relativeTime(member.lastActive)}</span>
              {member.reportCount ? (
                <span className="text-amber-200">{member.reportCount} reports</span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function MemberActions({ member }: { member: AdminMember }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteProfile = useMutation(api.admin.deleteProfile);
  const setStatus = useMutation(api.admin.setMemberStatus);
  const setVerified = useMutation(api.admin.setVerified);
  const setPlan = useMutation(api.admin.setPlan);

  async function removeProfile() {
    setDeleting(true);
    try {
      await deleteProfile({ profileId: member._id });
      toast.success("Profile deleted", {
        description: "The member is no longer visible and cannot access the app.",
      });
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Profile not deleted", {
        description: errorMessage(error),
      });
    } finally {
      setDeleting(false);
    }
  }

  async function updateStatus() {
    const next = member.status === "suspended" ? "active" : "suspended";
    try {
      await setStatus({ profileId: member._id, status: next });
      toast.success(next === "active" ? "Member restored." : "Member suspended.");
    } catch (error) {
      toast.error("Member not updated", { description: errorMessage(error) });
    }
  }

  async function verify() {
    try {
      await setVerified({ profileId: member._id, verified: !member.verified });
      toast.success(member.verified ? "Verification removed." : "Member verified.");
    } catch (error) {
      toast.error("Verification not updated", { description: errorMessage(error) });
    }
  }

  async function changePlan(next: MemberPlan) {
    try {
      await setPlan({ profileId: member._id, plan: next });
      toast.success(`Plan changed to ${next}.`);
    } catch (error) {
      toast.error("Plan not updated", { description: errorMessage(error) });
    }
  }

  if (member.status === "deleted") return <span className="text-xs text-white/40">Deleted</span>;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="admin-icon-button" aria-label={`Manage ${member.displayName}`}>
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#1b1b19] text-white">
          <DropdownMenuLabel className="text-[10px] uppercase text-white/35">
            Member actions
          </DropdownMenuLabel>
          <DropdownMenuItem
            onSelect={() => void verify()}
            className="focus:bg-white/8 focus:text-white"
          >
            <BadgeCheck className="mr-2 h-4 w-4" />
            {member.verified ? "Remove verification" : "Verify member"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuLabel className="text-[10px] uppercase text-white/35">
            Change plan
          </DropdownMenuLabel>
          {(["free", "premium", "vip"] as const).map((item) => (
            <DropdownMenuItem
              key={item}
              disabled={member.plan === item}
              onSelect={() => void changePlan(item)}
              className="capitalize focus:bg-white/8 focus:text-white"
            >
              <Crown className="mr-2 h-4 w-4" />
              {item}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuItem
            onSelect={() => setConfirmOpen(true)}
            className={
              member.status === "suspended"
                ? "text-emerald-300 focus:bg-emerald-400/10 focus:text-emerald-200"
                : "text-red-300 focus:bg-red-400/10 focus:text-red-200"
            }
          >
            {member.status === "suspended" ? (
              <RefreshCcw className="mr-2 h-4 w-4" />
            ) : (
              <Ban className="mr-2 h-4 w-4" />
            )}
            {member.status === "suspended" ? "Restore member" : "Suspend member"}
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/8" />
          <DropdownMenuItem
            onSelect={() => setDeleteOpen(true)}
            className="text-red-300 focus:bg-red-400/10 focus:text-red-200"
          >
            <Trash2 className="mr-2 h-4 w-4" /> Delete profile
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog
        open={deleteOpen}
        onOpenChange={(open) => {
          if (!deleting) setDeleteOpen(open);
        }}
      >
        <AlertDialogContent className="border-white/10 bg-[#191917] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {member.displayName}'s profile?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/45">
              This removes the profile from browsing, likes, matches, notifications, and
              conversations. The member will lose access and cannot restore the profile by signing
              in again. Moderation records are retained. This action cannot be undone here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={deleting}
              className="border-white/10 bg-transparent text-white"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              onClick={(event) => {
                event.preventDefault();
                void removeProfile();
              }}
              className="bg-red-500 text-white hover:bg-red-400"
            >
              {deleting ? "Deleting…" : "Delete profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="border-white/10 bg-[#191917] text-white sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {member.status === "suspended" ? "Restore this member?" : "Suspend this member?"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-white/45">
              {member.status === "suspended"
                ? `${member.displayName} will regain access to the app.`
                : `${member.displayName} will be removed from discovery and unable to interact until restored.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10 bg-transparent text-white hover:bg-white/5 hover:text-white">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void updateStatus()}
              className={
                member.status === "suspended"
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-red-500 text-white hover:bg-red-400"
              }
            >
              {member.status === "suspended" ? "Restore member" : "Suspend member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Metric({
  label,
  value,
  detail,
  Icon,
  tone,
}: {
  label: string;
  value: number;
  detail: string;
  Icon: typeof Activity;
  tone: "neutral" | "green" | "pink" | "amber";
}) {
  const tones = {
    neutral: "bg-white/[.05] text-white/55",
    green: "bg-emerald-400/10 text-emerald-300",
    pink: "bg-pink-400/10 text-pink-300",
    amber: "bg-amber-300/10 text-amber-200",
  };
  return (
    <div className="admin-panel p-5">
      <div className="flex items-center justify-between">
        <p className="admin-label">{label}</p>
        <span className={`grid h-8 w-8 place-items-center rounded-md ${tones[tone]}`}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tabular-nums">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-white/35">{detail}</p>
    </div>
  );
}

function ActivityChart({ data }: { data: AdminOverview["activity"] }) {
  const max = Math.max(1, ...data.map((item) => item.messages));
  return (
    <div className="mt-8 grid h-48 grid-cols-7 items-end gap-2 sm:gap-4">
      {data.map((item) => (
        <div key={item.date} className="flex h-full min-w-0 flex-col justify-end">
          <div className="group relative mx-auto flex h-[150px] w-full max-w-9 items-end rounded-sm bg-white/[.025]">
            <div
              className="w-full rounded-sm bg-pink-400/80 transition group-hover:bg-pink-300"
              style={{ height: `${Math.max(4, (item.messages / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-white px-1.5 py-1 text-[10px] font-semibold text-black group-hover:block">
              {item.messages} messages
            </span>
          </div>
          <p className="mt-2 truncate text-center text-[10px] text-white/30">
            {new Intl.DateTimeFormat("en", { weekday: "short" }).format(
              new Date(`${item.date}T12:00:00`),
            )}
          </p>
        </div>
      ))}
    </div>
  );
}

function PlanRow({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const width = total ? (count / total) * 100 : 0;
  return (
    <div>
      <div className="mb-2 flex justify-between text-xs">
        <span className="text-white/55">{label}</span>
        <span className="font-semibold tabular-nums">{count}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/[.05]">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <p className="mt-1 text-[10px] uppercase text-white/30">{label}</p>
    </div>
  );
}
function SectionHeader({ label, title }: { label: string; title: string }) {
  return (
    <div className="border-b border-white/8 p-5">
      <p className="admin-label">{label}</p>
      <h2 className="mt-1 text-lg font-semibold">{title}</h2>
    </div>
  );
}
function MemberIdentity({ member }: { member: AdminMember }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar member={member} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-semibold">{member.displayName}</p>
          {member.verified ? <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-pink-400" /> : null}
        </div>
        <p className="mt-0.5 truncate text-xs text-white/35">
          {member.email ||
            [member.town, member.region].filter(Boolean).join(", ") ||
            "Profile incomplete"}
        </p>
      </div>
    </div>
  );
}
function Avatar({ member }: { member: AdminMember }) {
  return member.photo ? (
    <img src={member.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/[.06] text-xs font-semibold text-white/55">
      {member.displayName.slice(0, 1).toUpperCase()}
    </span>
  );
}
function StatusBadge({ status }: { status: string }) {
  const active = status === "active" || status === "resolved";
  const open = status === "open";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold capitalize ${active ? "bg-emerald-400/8 text-emerald-300" : open ? "bg-amber-300/10 text-amber-200" : status === "suspended" ? "bg-red-400/10 text-red-300" : "bg-white/[.05] text-white/40"}`}
    >
      <span className="h-1 w-1 rounded-full bg-current" />
      {status}
    </span>
  );
}
function PlanBadge({ plan }: { plan: MemberPlan }) {
  return (
    <span
      className={`text-xs font-semibold capitalize ${plan === "vip" ? "text-amber-200" : plan === "premium" ? "text-pink-300" : "text-white/40"}`}
    >
      {plan}
    </span>
  );
}
function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="admin-input min-w-32 capitalize"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-[#191917] capitalize text-white">
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
function EmptyState({ Icon, title, copy }: { Icon: typeof Search; title: string; copy: string }) {
  return (
    <div className="grid min-h-72 place-items-center p-8 text-center">
      <div>
        <span className="mx-auto grid h-10 w-10 place-items-center rounded-md bg-white/[.04] text-white/30">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="mt-4 text-sm font-semibold">{title}</h3>
        <p className="mt-1 text-xs text-white/35">{copy}</p>
      </div>
    </div>
  );
}
function SectionLoading({ label }: { label: string }) {
  return (
    <div className="grid min-h-64 place-items-center">
      <div className="flex items-center gap-2 text-xs text-white/35">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        {label}
      </div>
    </div>
  );
}
function AdminLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#10100f]">
      <LoaderCircle className="h-5 w-5 animate-spin text-pink-400" />
    </main>
  );
}
function AdminDenied() {
  return (
    <main className="grid min-h-[75vh] place-items-center px-6 text-center">
      <div>
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-md bg-white/[.04] text-white/35">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <p className="admin-label mt-5">Restricted area</p>
        <h1 className="mt-2 text-2xl font-semibold">Admin access required</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-white/40">
          This area is only available to authorized namflirt. team members.
        </p>
        <Link to="/browse" className="admin-button-primary mt-6">
          Return to discover <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}
function relativeTime(time: number) {
  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60_000));
  if (minutes < 2) return "now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function formatDate(time: number) {
  return new Intl.DateTimeFormat("en-NA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(time);
}
function reasonLabel(reason: string) {
  return (
    (
      {
        fake_profile: "Fake profile",
        harassment: "Harassment",
        spam: "Spam",
        inappropriate: "Inappropriate content",
        other: "Other concern",
      } as Record<string, string>
    )[reason] ?? reason
  );
}
