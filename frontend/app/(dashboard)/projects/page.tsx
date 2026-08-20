"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/api";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import ProjectMembersModal from "@/components/project-members/ProjectMembersModal";
import {
  Folder,
  Search,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Users,
  ArrowUpRight,
} from "lucide-react";



type ProjectStatus =
  | "PLANNING"
  | "ACTIVE"
  | "ON_HOLD"
  | "COMPLETED"
  | "CANCELLED";


interface Project {
  id: string;

  companyName: string;
  projectName: string;
  description?: string | null;

  status: ProjectStatus;

  startDate?: string | null;
  endDate?: string | null;

  createdById?: string;

  createdAt?: string;
  updatedAt?: string;

  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };

  
  _count?: {
    members: number;
  };
}


interface ProjectResponse {
  success: boolean;
  message?: string;

  data?: Project[];

  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}




const statusConfig: Record<
  ProjectStatus,
  {
    label: string;
    dot: string;
    badge: string;
  }
> = {
  PLANNING: {
    label: "Planning",
    dot: "bg-blue-500",
    badge:
      "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },

  ACTIVE: {
    label: "Active",
    dot: "bg-emerald-500",
    badge:
      "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },

  ON_HOLD: {
    label: "On Hold",
    dot: "bg-amber-500",
    badge:
      "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },

  COMPLETED: {
    label: "Completed",
    dot: "bg-violet-500",
    badge:
      "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  },

  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-500",
    badge:
      "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};




function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">

      <div className="h-20 rounded-2xl bg-muted" />

      <div className="h-16 rounded-2xl bg-muted" />

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-64 rounded-2xl bg-muted"
          />
        ))}

      </div>
    </div>
  );
}




export default function ProjectsPage() {

  const router = useRouter();

const [membersModalOpen, setMembersModalOpen] =
  useState(false);

const [selectedProjectForMembers, setSelectedProjectForMembers] =
  useState<Project | null>(null);
  

  const [projects, setProjects] =
    useState<Project[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);


  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"ALL" | ProjectStatus>("ALL");


  const [showModal, setShowModal] =
    useState(false);

  const [editingProject, setEditingProject] =
    useState<Project | null>(null);


  const [menuId, setMenuId] =
    useState<string | null>(null);


  const [form, setForm] = useState({
    companyName: "",
    projectName: "",
    description: "",
    status: "PLANNING" as ProjectStatus,
    startDate: "",
    endDate: "",
  });


  const [saving, setSaving] =
    useState(false);

  const [deletingId, setDeletingId] =
    useState<string | null>(null);

const [deleteProject, setDeleteProject] =
  useState<Project | null>(null);

const [actionError, setActionError] =
  useState<string | null>(null);
  

  const fetchProjects = useCallback(
    async () => {

      try {

        setLoading(true);

        const response =
          await api.get<ProjectResponse>(
            "/projects?limit=100"
          );

        const result =
          response.data;


        if (!result.success) {

          throw new Error(
            result.message ||
              "Failed to load projects."
          );
        }


        setProjects(
          result.data || []
        );

        setError(null);

      } catch (err) {

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load projects."
        );

      } finally {

        setLoading(false);
      }

    },
    []
  );


  useEffect(() => {

    fetchProjects();

  }, [fetchProjects]);


 

  const filteredProjects =
    useMemo(() => {

      const searchValue =
        search
          .trim()
          .toLowerCase();


      return projects.filter(
        (project) => {

          const matchesSearch =
            !searchValue ||
            project.projectName
              .toLowerCase()
              .includes(searchValue) ||

            project.companyName
              .toLowerCase()
              .includes(searchValue) ||

            project.description
              ?.toLowerCase()
              .includes(searchValue);


          const matchesStatus =
            statusFilter === "ALL" ||
            project.status ===
              statusFilter;


          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );

    }, [
      projects,
      search,
      statusFilter,
    ]);


  

  const openCreateModal = () => {

    setEditingProject(null);

    setForm({
      companyName: "",
      projectName: "",
      description: "",
      status: "PLANNING",
      startDate: "",
      endDate: "",
    });

    setShowModal(true);
  };


  

  const openEditModal = (
    project: Project
  ) => {

    setEditingProject(project);

    setForm({
      companyName:
        project.companyName,

      projectName:
        project.projectName,

      description:
        project.description || "",

      status:
        project.status,

      startDate:
        project.startDate
          ? project.startDate.substring(
              0,
              10
            )
          : "",

      endDate:
        project.endDate
          ? project.endDate.substring(
              0,
              10
            )
          : "",
    });

    setMenuId(null);

    setShowModal(true);
  };


  

  const handleSubmit = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    try {

      setSaving(true);


      const payload: Record<
        string,
        unknown
      > = {

        companyName:
          form.companyName.trim(),

        projectName:
          form.projectName.trim(),

        description:
          form.description.trim() ||
          undefined,

        status:
          form.status,
      };


      if (form.startDate) {

        payload.startDate =
          new Date(
            `${form.startDate}T00:00:00`
          ).toISOString();
      }


      if (form.endDate) {

        payload.endDate =
          new Date(
            `${form.endDate}T23:59:59`
          ).toISOString();
      }


      let response;


      // UPDATE
      if (editingProject) {

        response =
          await api.put(
            `/projects/${editingProject.id}`,
            payload
          );

      }

      // CREATE
      else {

        response =
          await api.post(
            "/projects",
            payload
          );
      }


      const result =
        response.data;


      if (!result.success) {

        throw new Error(
          result.message ||
            "Failed to save project."
        );
      }


      setShowModal(false);

      setEditingProject(null);


      await fetchProjects();

    } catch (err) {

      setActionError(
        err instanceof Error
          ? err.message
          : "Failed to save project."
      );

    }finally {

      setSaving(false);
    }
  };


 

const handleDelete = async (
  project: Project
) => {

  setMenuId(null);

  try {

    setDeletingId(project.id);

    const response =
      await api.delete(
        `/projects/${project.id}`
      );

    const result =
      response.data;

    if (!result.success) {

      throw new Error(
        result.message ||
          "Failed to delete project."
      );
    }

    setDeleteProject(null);

    await fetchProjects();

  } catch (err) {

    setActionError(
      err instanceof Error
        ? err.message
        : "Failed to delete project."
    );

  } finally {

    setDeletingId(null);
  }
};
const openMembersModal = (project: Project) => {
  setMenuId(null);
  setSelectedProjectForMembers(project);
  setMembersModalOpen(true);
};

const closeMembersModal = () => {
  setMembersModalOpen(false);
  setSelectedProjectForMembers(null);
};
 

  if (loading) {

    return (
      <LoadingSkeleton />
    );
  }



  if (error) {

    return (
      <div className="flex min-h-[500px] items-center justify-center">

        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">

          <h2 className="text-lg font-semibold text-card-foreground">
            Unable to load projects
          </h2>


          <p className="mt-2 text-sm text-muted-foreground">
            {error}
          </p>


          <button
            onClick={fetchProjects}
            className="mt-6 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Try again
          </button>

        </div>

      </div>
    );
  }


  

  return (
    <div className="space-y-6 pb-10">


     

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Projects
          </h1>

        </div>


        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition hover:opacity-90"
        >

          <Plus className="h-4 w-4" />

          New Project

        </button>

      </div>


      

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">

        <div className="flex flex-col gap-3 md:flex-row">


          {/* Search */}

          <div className="relative flex-1">

            <Search
              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />


            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              placeholder="Search projects or companies..."
              className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus:border-primary"
            />

          </div>


          {/* Status */}

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value as
                  | "ALL"
                  | ProjectStatus
              )
            }
            className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
          >

            <option value="ALL">
              All statuses
            </option>

            <option value="PLANNING">
              Planning
            </option>

            <option value="ACTIVE">
              Active
            </option>

            <option value="ON_HOLD">
              On Hold
            </option>

            <option value="COMPLETED">
              Completed
            </option>

            <option value="CANCELLED">
              Cancelled
            </option>

          </select>

        </div>


        <div className="mt-3 text-xs text-muted-foreground">

          Showing{" "}
          {filteredProjects.length}{" "}
          of{" "}
          {projects.length}{" "}
          projects

        </div>

      </div>


      

      {filteredProjects.length === 0 ? (

        <div className="rounded-2xl border border-border bg-card p-14 text-center shadow-sm">

          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">

            <Folder className="h-7 w-7" />

          </div>


          <h3 className="mt-5 text-lg font-semibold text-card-foreground">

            {projects.length === 0
              ? "No projects yet"
              : "No matching projects"}

          </h3>


          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">

            {projects.length === 0
              ? "Create your first project to start organizing folders, tasks, members, and activities."
              : "Try changing your search or status filter."}

          </p>


          {projects.length === 0 && (

            <button
              onClick={openCreateModal}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >

              <Plus className="h-4 w-4" />

              Create Project

            </button>

          )}

        </div>

      ) : (


       

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredProjects.map(
            (project) => {

              const config =
                statusConfig[
                  project.status
                ];


              return (

                <div
                  key={project.id}
                  className="group relative rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >


                  

                  <div className="flex items-start justify-between gap-4">


                    <button
                      onClick={() =>
                        router.push(
                          `/projects/${project.id}`
                        )
                      }
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >

                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">

                        <Folder className="h-5 w-5" />

                      </div>


                      <div className="min-w-0">

                        <h3 className="truncate font-semibold text-card-foreground">

                          {project.projectName}

                        </h3>


                        <p className="mt-1 truncate text-sm text-muted-foreground">

                          {project.companyName}

                        </p>

                      </div>

                    </button>


                   

                    <div className="relative">

                      <button
                        onClick={() =>
                          setMenuId(
                            menuId ===
                              project.id
                              ? null
                              : project.id
                          )
                        }
                        className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >

                        <MoreVertical className="h-5 w-5" />

                      </button>


                      {menuId ===
                        project.id && (

                        <div className="absolute right-0 top-10 z-20 w-36 rounded-xl border border-border bg-card p-1.5 shadow-lg">

                        {/* Edit */}
                        <button
                          onClick={() =>
                            openEditModal(project)
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-card-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>

                        {/* Members */}
                        <button
                          onClick={() =>
                            openMembersModal(project)
                          }
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-card-foreground hover:bg-muted"
                        >
                          <Users className="h-4 w-4" />
                          Members
                        </button>

                        {/* Delete */}
                       <button
                          onClick={() => {
                            setMenuId(null);
                            setDeleteProject(project);
                          }}
                          disabled={deletingId === project.id}
                          className="
                            flex w-full items-center gap-2
                            rounded-lg px-3 py-2
                            text-sm text-red-600
                            hover:bg-red-500/10
                            dark:text-red-400
                          "
                        >
                          <Trash2 className="h-4 w-4" />

                          Delete
                        </button>

                      </div>

                      )}

                    </div>

                  </div>


                  

                  <div className="mt-5">

                    <span
                      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${config.badge}`}
                    >

                      <span
                        className={`h-1.5 w-1.5 rounded-full ${config.dot}`}
                      />

                      {config.label}

                    </span>

                  </div>


                  

                  <p className="mt-4 line-clamp-2 min-h-[40px] text-sm leading-5 text-muted-foreground">

                    {project.description ||
                      "No project description provided."}

                  </p>


                 

                  <div className="mt-6 grid grid-cols-3 gap-2 border-t border-border pt-5">


                    {/* MEMBERS */}

                   <button
                        type="button"
                        onClick={() =>
                          openMembersModal(project)
                        }
                        className="group/members text-left"
                      >
                        <div className="flex items-center gap-1.5 text-muted-foreground transition group-hover/members:text-primary">
                          <Users className="h-4 w-4" />

                          <span className="text-xs">
                            Members
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-semibold text-card-foreground">
                          {project._count?.members ?? 0}
                        </p>

                        <p className="mt-0.5 text-[11px] text-muted-foreground group-hover/members:text-primary">
                          Manage members
                        </p>
                      </button>

                  </div>


                 

                  <button
                    onClick={() =>
                      router.push(
                        `/projects/${project.id}`
                      )
                    }
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition hover:border-primary hover:bg-primary/5 hover:text-primary"
                  >

                    Open Project

                    <ArrowUpRight className="h-4 w-4" />

                  </button>

                </div>

              );
            }
          )}

        </div>

      )}


      {/* ========================================================
          CREATE / EDIT MODAL
      ======================================================== */}

      {showModal && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {

            if (
              e.target ===
              e.currentTarget
            ) {

              setShowModal(false);

            }

          }}
        >

          <div className="w-full max-w-2xl rounded-2xl border border-border bg-card shadow-2xl">


            {/* ==================================================
                MODAL HEADER
            ================================================== */}

            <div className="border-b border-border p-6">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-semibold text-card-foreground">

                    {editingProject
                      ? "Edit Project"
                      : "Create Project"}

                  </h2>


                  <p className="mt-1 text-sm text-muted-foreground">

                    {editingProject
                      ? "Update your project details."
                      : "Create a new project workspace."}

                  </p>

                </div>


                <button
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >

                  ✕

                </button>

              </div>

            </div>


            {/* ==================================================
                FORM
            ================================================== */}

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >


              {/* Company + Project */}

              <div className="grid gap-5 md:grid-cols-2">


                {/* Company */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-card-foreground">

                    Company Name

                  </label>


                  <input
                    required
                    value={
                      form.companyName
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        companyName:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. ABC Company"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />

                </div>


                {/* Project */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-card-foreground">

                    Project Name

                  </label>


                  <input
                    required
                    value={
                      form.projectName
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        projectName:
                          e.target.value,
                      })
                    }
                    placeholder="e.g. CRM System"
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />

                </div>

              </div>


              {/* Description */}

              <div>

                <label className="mb-2 block text-sm font-medium text-card-foreground">

                  Description

                </label>


                <textarea
                  rows={3}
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  placeholder="Describe the project..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                />

              </div>


              {/* Status */}

              <div>

                <label className="mb-2 block text-sm font-medium text-card-foreground">

                  Status

                </label>


                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status:
                        e.target.value as ProjectStatus,
                    })
                  }
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                >

                  <option value="PLANNING">
                    Planning
                  </option>

                  <option value="ACTIVE">
                    Active
                  </option>

                  <option value="ON_HOLD">
                    On Hold
                  </option>

                  <option value="COMPLETED">
                    Completed
                  </option>

                  <option value="CANCELLED">
                    Cancelled
                  </option>

                </select>

              </div>


              {/* Dates */}

              <div className="grid gap-5 md:grid-cols-2">


                {/* Start */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-card-foreground">

                    Start Date

                  </label>


                  <input
                    type="date"
                    value={
                      form.startDate
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        startDate:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />

                </div>


                {/* End */}

                <div>

                  <label className="mb-2 block text-sm font-medium text-card-foreground">

                    End Date

                  </label>


                  <input
                    type="date"
                    value={
                      form.endDate
                    }
                    min={
                      form.startDate ||
                      undefined
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        endDate:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none focus:border-primary"
                  />

                </div>

              </div>


              {/* ==================================================
                  ACTIONS
              ================================================== */}

              <div className="flex justify-end gap-3 border-t border-border pt-5">


                <button
                  type="button"
                  onClick={() =>
                    setShowModal(false)
                  }
                  className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-card-foreground hover:bg-muted"
                >

                  Cancel

                </button>


                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {saving
                    ? "Saving..."
                    : editingProject
                    ? "Save Changes"
                    : "Create Project"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}
      <ConfirmationModal
  open={!!deleteProject}
  title="Delete Project"
  message={
    deleteProject
      ? `Are you sure you want to delete "${deleteProject.projectName}"? This action cannot be undone.`
      : ""
  }
  confirmText="Delete Project"
  cancelText="Cancel"
  variant="danger"
  loading={
    deleteProject
      ? deletingId === deleteProject.id
      : false
  }
  onCancel={() => {
    if (!deletingId) {
      setDeleteProject(null);
    }
  }}
  onConfirm={() => {
    if (deleteProject) {
      handleDelete(deleteProject);
    }
  }}
/>
<ConfirmationModal
  open={!!actionError}
  title="Something went wrong"
  message={
    actionError ||
    "An unexpected error occurred."
  }
  confirmText="OK"
  cancelText={null}
  variant="primary"
  onCancel={() => {
    setActionError(null);
  }}
  onConfirm={() => {
    setActionError(null);
  }}
/>
<ProjectMembersModal
  projectId={
    selectedProjectForMembers?.id ?? ""
  }
  open={
    membersModalOpen &&
    !!selectedProjectForMembers
  }
  onClose={closeMembersModal}
  onMembersChanged={fetchProjects}
/>
    </div>
  );
}