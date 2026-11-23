"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Compass,
  FileSpreadsheet,
  Inbox,
  Lock,
  LogOut,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Users,
  Video,
} from "lucide-react";
import type {
  AdminClaimRecord,
  AdminCreatorRecord,
  AdminSubmissionRecord,
} from "@/lib/admin/repository";
import { PlatformIcon } from "@/components/PlatformIcon";
import { ClaimsPanel } from "./ClaimsPanel";
import { CreatorFormModal } from "./CreatorFormModal";
import { CsvImportPanel } from "./CsvImportPanel";
import { SubmissionsPanel } from "./SubmissionsPanel";
import { VideoManagerModal } from "./VideoManagerModal";

interface AdminDashboardProps {
  initialAuthenticated: boolean;
  usingDefaultPassword: boolean;
  initialCreators: AdminCreatorRecord[];
  initialClaims: AdminClaimRecord[];
  initialSubmissions: AdminSubmissionRecord[];
}

type AdminTab = "creators" | "csv" | "submissions" | "claims";

export function AdminDashboard({
  initialAuthenticated,
  usingDefaultPassword,
  initialCreators,
  initialClaims,
  initialSubmissions,
}: AdminDashboardProps) {
  const [authenticated, setAuthenticated] = useState(initialAuthenticated);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [creators, setCreators] =
    useState<AdminCreatorRecord[]>(initialCreators);
  const [claims, setClaims] = useState<AdminClaimRecord[]>(initialClaims);
  const [submissions, setSubmissions] =
    useState<AdminSubmissionRecord[]>(initialSubmissions);
  const [activeTab, setActiveTab] = useState<AdminTab>("creators");
  const [filterText, setFilterText] = useState("");

  const [editingCreator, setEditingCreator] = useState<
    AdminCreatorRecord | null | undefined
  >(undefined); // undefined = closed, null = add new, record = edit
  const [videoModalCreatorId, setVideoModalCreatorId] = useState<string | null>(
    null
  );
  const [deletingCreatorId, setDeletingCreatorId] = useState<string | null>(
    null
  );

  const refreshData = useCallback(async () => {
    const [creatorsRes, claimsRes, submissionsRes] = await Promise.all([
      fetch("/api/admin/creators", { cache: "no-store" }),
      fetch("/api/admin/claims", { cache: "no-store" }),
      fetch("/api/admin/submissions", { cache: "no-store" }),
    ]);
    if (
      creatorsRes.status === 401 ||
      claimsRes.status === 401 ||
      submissionsRes.status === 401
    ) {
      setAuthenticated(false);
      return;
    }
    if (creatorsRes.ok) {
      const data = (await creatorsRes.json()) as {
        creators: AdminCreatorRecord[];
      };
      setCreators(data.creators);
    }
    if (claimsRes.ok) {
      const data = (await claimsRes.json()) as { claims: AdminClaimRecord[] };
      setClaims(data.claims);
    }
    if (submissionsRes.ok) {
      const data = (await submissionsRes.json()) as {
        submissions: AdminSubmissionRecord[];
      };
      setSubmissions(data.submissions);
    }
  }, []);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setLoginError(data.error || "Incorrect password.");
        return;
      }
      setPassword("");
      setAuthenticated(true);
      await refreshData();
    } catch {
      setLoginError("Unable to reach server.");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setAuthenticated(false);
    setCreators([]);
    setClaims([]);
    setSubmissions([]);
  };

  const handleDeleteCreator = async (creator: AdminCreatorRecord) => {
    const confirmed = window.confirm(
      `Delete "${creator.name}" and all ${creator.videos.length} video(s)? This cannot be undone.`
    );
    if (!confirmed) return;

    setDeletingCreatorId(creator.id);
    try {
      const res = await fetch(`/api/admin/creators/${creator.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshData();
      }
    } finally {
      setDeletingCreatorId(null);
    }
  };

  const filteredCreators = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return creators;
    return creators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.placesCovered.some((p) => p.toLowerCase().includes(q)) ||
        c.platform.toLowerCase().includes(q) ||
        c.travelStyle.some((s) => s.toLowerCase().includes(q))
    );
  }, [creators, filterText]);

  const activeVideoModalCreator =
    creators.find((c) => c.id === videoModalCreatorId) ?? null;

  const totalVideos = creators.reduce((sum, c) => sum + c.videos.length, 0);
  const verifiedCount = creators.filter((c) => c.verified).length;
  const pendingClaimsCount = claims.filter((c) => c.status === "pending").length;
  const pendingSubmissionsCount = submissions.filter(
    (s) => s.status === "pending"
  ).length;

  // Password Login Screen
  if (!authenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/5 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-900 text-emerald-200">
              <Lock className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-stone-900">
                TravelVlogFinder Admin
              </h1>
              <p className="text-xs text-stone-500">
                Manage creators, videos, CSV imports &amp; profile claims
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="admin-password"
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-600"
              >
                Admin password
              </label>
              <input
                id="admin-password"
                type="password"
                required
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="min-h-12 w-full rounded-xl border border-stone-300 px-3.5 text-base text-stone-900 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-600/20 focus:outline-none"
              />
            </div>

            {usingDefaultPassword && (
              <p className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs leading-relaxed text-amber-950">
                Local dev default password: <strong>admin123</strong>. Set{" "}
                <code>ADMIN_PASSWORD</code> in <code>.env.local</code> before
                deploying.
              </p>
            )}

            {loginError && (
              <p className="rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-semibold text-red-700">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="min-h-12 w-full rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white shadow-xs transition hover:bg-emerald-800 disabled:opacity-60"
            >
              {loggingIn ? "Signing in..." : "Sign in to Admin"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-800"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Traveler Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-16">
      {/* Top Admin Header */}
      <header className="bg-emerald-950 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <Compass className="h-5 w-5 text-emerald-200" />
            </span>
            <div>
              <h1 className="text-base font-extrabold tracking-tight sm:text-lg">
                TravelVlogFinder Admin
              </h1>
              <p className="text-xs text-emerald-200/80">
                Kerala MVP · Fixed taxonomy CRUD, CSV bulk import &amp; claims
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-white/10 px-3.5 text-xs font-semibold text-white transition hover:bg-white/20 sm:text-sm"
            >
              <ArrowLeft className="h-4 w-4" />
              Traveler Search
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/20 px-3.5 text-xs font-semibold text-emerald-100 transition hover:bg-white/10 sm:text-sm"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pt-6 sm:px-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-stone-500">Creators</p>
            <p className="mt-1 text-2xl font-extrabold text-stone-900">
              {creators.length}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-stone-500">Verified</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-700">
              {verifiedCount}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-stone-500">
              Featured Videos
            </p>
            <p className="mt-1 text-2xl font-extrabold text-stone-900">
              {totalVideos}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-stone-500">
              Pending Submissions
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-700">
              {pendingSubmissionsCount}
            </p>
          </div>
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs">
            <p className="text-xs font-semibold text-stone-500">
              Pending Claims
            </p>
            <p className="mt-1 text-2xl font-extrabold text-amber-700">
              {pendingClaimsCount}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab("creators")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "creators"
                ? "bg-emerald-700 text-white shadow-xs"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            <Users className="h-4 w-4" />
            Creators &amp; Videos ({creators.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("csv")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "csv"
                ? "bg-emerald-700 text-white shadow-xs"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            <FileSpreadsheet className="h-4 w-4" />
            CSV Bulk Import
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("submissions")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "submissions"
                ? "bg-emerald-700 text-white shadow-xs"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            <Inbox className="h-4 w-4" />
            Submissions
            {pendingSubmissionsCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {pendingSubmissionsCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("claims")}
            className={`inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold transition ${
              activeTab === "claims"
                ? "bg-emerald-700 text-white shadow-xs"
                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            Profile Claims
            {pendingClaimsCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1.5 text-xs font-bold text-white">
                {pendingClaimsCount}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-5">
          {activeTab === "creators" && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-stone-400" />
                  <input
                    type="search"
                    value={filterText}
                    onChange={(e) => setFilterText(e.target.value)}
                    placeholder="Filter creators by name, place, style, or platform..."
                    className="min-h-11 w-full rounded-xl border border-stone-300 bg-white pr-4 pl-10 text-sm text-stone-900 focus:border-emerald-700 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setEditingCreator(null)}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-bold text-white shadow-xs hover:bg-emerald-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Creator
                </button>
              </div>

              <div className="space-y-3">
                {filteredCreators.map((creator) => (
                  <div
                    key={creator.id}
                    className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs sm:p-5"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <PlatformIcon
                            platform={creator.platform}
                            className="h-4 w-4"
                          />
                          <h3 className="text-base font-bold text-stone-900">
                            {creator.name}
                          </h3>
                          {creator.verified && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
                              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
                              Verified
                            </span>
                          )}
                          {creator.pendingClaimsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => setActiveTab("claims")}
                              className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-800 ring-1 ring-amber-200 hover:bg-amber-100"
                            >
                              {creator.pendingClaimsCount} pending claim
                            </button>
                          )}
                        </div>

                        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-stone-600">
                          <span>
                            Rs{" "}
                            {creator.budgetMinPerDay.toLocaleString("en-IN")} to{" "}
                            {creator.budgetMaxPerDay.toLocaleString("en-IN")}
                            /day
                          </span>
                          <span>
                            {creator.minDays}-{creator.maxDays} days
                          </span>
                          <span>{creator.followersRange}</span>
                          <span>Checked: {creator.lastChecked}</span>
                        </div>

                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {creator.placesCovered.map((p) => (
                            <span
                              key={p}
                              className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900"
                            >
                              {p}
                            </span>
                          ))}
                          {creator.travelStyle.map((s) => (
                            <span
                              key={s}
                              className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700"
                            >
                              {s}
                            </span>
                          ))}
                          {creator.language.map((l) => (
                            <span
                              key={l}
                              className="rounded-full border border-stone-200 px-2 py-0.5 text-xs text-stone-600"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 lg:shrink-0">
                        <button
                          type="button"
                          onClick={() => setVideoModalCreatorId(creator.id)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100"
                        >
                          <Video className="h-3.5 w-3.5" />
                          Videos ({creator.videos.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingCreator(creator)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-stone-300 bg-white px-3.5 text-xs font-semibold text-stone-700 hover:bg-stone-50"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        <button
                          type="button"
                          disabled={deletingCreatorId === creator.id}
                          onClick={() => handleDeleteCreator(creator)}
                          className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-red-200 bg-white px-3.5 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "csv" && (
            <CsvImportPanel
              onImported={async () => {
                await refreshData();
              }}
            />
          )}

          {activeTab === "submissions" && (
            <SubmissionsPanel
              submissions={submissions}
              onUpdated={refreshData}
            />
          )}

          {activeTab === "claims" && (
            <ClaimsPanel claims={claims} onUpdated={refreshData} />
          )}
        </div>
      </main>

      {editingCreator !== undefined && (
        <CreatorFormModal
          creator={editingCreator}
          onClose={() => setEditingCreator(undefined)}
          onSaved={refreshData}
        />
      )}

      {activeVideoModalCreator && (
        <VideoManagerModal
          creator={activeVideoModalCreator}
          onClose={() => setVideoModalCreatorId(null)}
          onUpdated={refreshData}
        />
      )}
    </div>
  );
}
