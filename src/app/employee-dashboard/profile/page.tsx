"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Loader2, Mail, Pencil, Phone, RefreshCw, User } from "lucide-react";
import EmployeeProfileEditModal from "@/components/employee-dashboard/EmployeeProfileEditModal";
import {
    profileToFormValues,
    type EmployeeProfileFormValues,
} from "@/lib/employeeProfileFormSections";

type EmployeeProfile = EmployeeProfileFormValues & {
    portalEmail: string;
    portalStatus: string;
};

function normalizeProfile(data: Record<string, unknown>): EmployeeProfile {
    const base = profileToFormValues(data as Partial<EmployeeProfileFormValues>);
    const str = (key: string) => (typeof data[key] === "string" ? data[key] : "");

    return {
        ...base,
        portalEmail: str("portalEmail"),
        portalStatus: str("portalStatus"),
    };
}

function display(value: string) {
    const v = value.trim();
    return v || "—";
}

function hasValue(value: string) {
    return value.trim().length > 0;
}

function hasAny(values: string[]) {
    return values.some(hasValue);
}

function ProfileField({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-medium text-gray-900 break-words">{display(value)}</p>
        </div>
    );
}

function StatusBadge({ status, variant = "employee" }: { status: string; variant?: "employee" | "portal" }) {
    const s = status.trim() || "—";
    const isActive = s === "Active";
    const isWarning = variant === "portal" && s === "Disabled";

    const tone = isActive
        ? "bg-green-50 text-green-800 ring-1 ring-green-600/15"
        : isWarning
          ? "bg-amber-50 text-amber-800 ring-1 ring-amber-600/15"
          : "bg-gray-100 text-gray-700 ring-1 ring-gray-200";

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>
            {isActive ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} aria-hidden /> : null}
            {variant === "portal" && s !== "—" ? `Portal: ${s}` : s}
        </span>
    );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <section className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100 bg-gray-50/80">
                <h2 className="text-sm font-bold text-gray-900">{title}</h2>
            </div>
            <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">{children}</div>
        </section>
    );
}

export default function EmployeeProfilePage() {
    const [profile, setProfile] = useState<EmployeeProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");

    const loadProfile = useCallback(async () => {
        setIsLoading(true);
        setLoadError("");

        try {
            const response = await fetch("/api/employee/profile", { cache: "no-store" });
            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(typeof data.message === "string" ? data.message : "Failed to load profile");
            }

            setProfile(normalizeProfile(data as Record<string, unknown>));
        } catch (error) {
            setLoadError(error instanceof Error ? error.message : "Failed to load profile");
            setProfile(null);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadProfile();
    }, [loadProfile]);

    const initials = useMemo(() => {
        const name = profile?.fullName.trim() || profile?.employeeId || "E";
        const parts = name.split(/\s+/).filter(Boolean);
        if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        return name.charAt(0).toUpperCase();
    }, [profile]);

    const formInitialValues = useMemo(() => (profile ? profileToFormValues(profile) : null), [profile]);

    const handleProfileSaved = (data: Record<string, unknown>) => {
        setProfile(normalizeProfile(data));
        setSaveMessage("Profile updated successfully");
    };

    if (isLoading) {
        return (
            <div className="space-y-6 relative">
                <div className="flex min-h-[320px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#0a2a5e]" aria-hidden />
                    <span className="sr-only">Loading profile…</span>
                </div>
            </div>
        );
    }

    if (loadError || !profile || !formInitialValues) {
        return (
            <div className="space-y-6 relative">
                <div className="rounded-md border border-red-200 bg-red-50 px-6 py-10 text-center space-y-4">
                    <p className="text-sm font-medium text-red-700">{loadError || "Profile not available"}</p>
                    <button
                        type="button"
                        onClick={() => void loadProfile()}
                        className="inline-flex items-center gap-2 rounded-md bg-[#0a2a5e] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                    >
                        <RefreshCw className="h-4 w-4" aria-hidden />
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    const p = profile;

    const showBasic = hasAny([
        p.gender,
        p.dateOfBirth,
        p.maritalStatus,
        p.bloodGroup,
        p.nationality,
        p.religion,
        p.category,
    ]);
    const showContact = hasAny([
        p.personalEmail,
        p.personalMobileNumber,
        p.officialEmail,
        p.officialMobileNumber,
        p.currentAddress,
        p.permanentAddress,
    ]);
    const showParent = hasAny([p.parentName, p.parentMobileNumber, p.parentOccupation, p.guardianRelation]);
    const showWork = hasAny([
        p.department,
        p.role,
        p.employeeType,
        p.employmentCategory,
        p.joiningDate,
        p.workLocation,
        p.branchName,
        p.reportingManager,
        p.probationPeriod,
    ]);
    const showEducation = hasAny([
        p.higherEducationQualification,
        p.higherEducationCourseName,
        p.higherEducationInstitution,
        p.higherEducationPassingYear,
        p.higherEducationCgpaOrPercentage,
        p.higherEducationSpecialization,
    ]);
    const showPrevious = hasAny([
        p.previousCompanyName,
        p.previousDesignation,
        p.previousSalary,
        p.workExperienceYears,
        p.previousJoiningDate,
        p.previousRelievingDate,
        p.reasonForLeaving,
        p.referencePersonName,
        p.referenceContactNumber,
    ]);
    const showIdentity = hasAny([
        p.aadhaarNumber,
        p.panNumber,
        p.passportNumber,
        p.voterIdNumber,
        p.drivingLicenseNumber,
        p.uanNumber,
        p.esicNumber,
        p.pfNumber,
    ]);
    const showBank = hasAny([
        p.bankName,
        p.bankBranchName,
        p.accountHolderName,
        p.accountNumber,
        p.ifscCode,
        p.upiId,
    ]);

    const hasDetailSections =
        showBasic || showContact || showParent || showWork || showEducation || showPrevious || showIdentity || showBank;

    return (
        <div className="space-y-4 sm:space-y-6 relative pb-6">
            {saveMessage ? (
                <p className="text-sm text-emerald-800 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3">
                    {saveMessage}
                </p>
            ) : null}

            <div className="bg-white rounded-md border border-gray-100 shadow-sm overflow-hidden">
                <div className="relative bg-gradient-to-r from-[#06124f] to-[#0a2a5e] px-4 sm:px-6 pt-5 pb-6 sm:pt-6 sm:pb-8">
                    <button
                        type="button"
                        onClick={() => {
                            setSaveMessage("");
                            setIsEditModalOpen(true);
                        }}
                        className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white/25 sm:top-6 sm:right-6 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm sm:font-semibold"
                        aria-label="Edit profile"
                    >
                        <Pencil className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="hidden sm:inline">Edit profile</span>
                    </button>

                    <div className="flex items-start sm:items-center gap-3 sm:gap-5 pr-12 sm:pr-36">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-md bg-gradient-to-br from-[#06b6d4] to-[#06124f] flex items-center justify-center text-white text-xl sm:text-2xl font-black shadow-lg ring-4 ring-white/90 shrink-0">
                            {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg sm:text-2xl font-bold text-white break-words leading-snug">
                                {display(p.fullName)}
                            </h2>
                            <p className="text-xs sm:text-sm text-white/80 mt-1 font-medium">
                                Employee ID:{" "}
                                <span className="text-white font-semibold">{display(p.employeeId)}</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-6 py-4 sm:py-6">
                    <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-5">
                        <StatusBadge status={p.employeeStatus || "—"} variant="employee" />
                        <StatusBadge status={p.portalStatus || "—"} variant="portal" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-3 sm:px-4">
                            <Mail className="h-5 w-5 text-[#0a2a5e] shrink-0" aria-hidden />
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">Official email</p>
                                <p className="text-sm font-medium text-gray-900 break-all sm:truncate">
                                    {display(p.officialEmail || p.portalEmail)}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-md bg-gray-50 border border-gray-100 px-3 py-3 sm:px-4">
                            <Phone className="h-5 w-5 text-[#0a2a5e] shrink-0" aria-hidden />
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">Official mobile</p>
                                <p className="text-sm font-medium text-gray-900 break-all">
                                    {display(p.officialMobileNumber)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {showBasic && (
                <SectionCard title="Personal information">
                    <ProfileField label="Gender" value={p.gender} />
                    <ProfileField label="Date of birth" value={p.dateOfBirth} />
                    <ProfileField label="Marital status" value={p.maritalStatus} />
                    <ProfileField label="Blood group" value={p.bloodGroup} />
                    <ProfileField label="Nationality" value={p.nationality} />
                    <ProfileField label="Religion" value={p.religion} />
                    <ProfileField label="Category" value={p.category} />
                </SectionCard>
            )}

            {showContact && (
                <SectionCard title="Contact details">
                    <ProfileField label="Personal mobile" value={p.personalMobileNumber} />
                    <ProfileField label="Official mobile" value={p.officialMobileNumber} />
                    <ProfileField label="Personal email" value={p.personalEmail} />
                    <ProfileField label="Official email" value={p.officialEmail} />
                    <div className="sm:col-span-2 lg:col-span-3">
                        <ProfileField label="Current address" value={p.currentAddress} />
                    </div>
                    <div className="sm:col-span-2 lg:col-span-3">
                        <ProfileField label="Permanent address" value={p.permanentAddress} />
                    </div>
                </SectionCard>
            )}

            {showParent && (
                <SectionCard title="Parent / family details">
                    <ProfileField label="Parent name" value={p.parentName} />
                    <ProfileField label="Parent mobile" value={p.parentMobileNumber} />
                    <ProfileField label="Parent occupation" value={p.parentOccupation} />
                    <ProfileField label="Guardian relation" value={p.guardianRelation} />
                </SectionCard>
            )}

            {showWork && (
                <SectionCard title="Work information">
                    <ProfileField label="Department" value={p.department} />
                    <ProfileField label="Role / designation" value={p.role} />
                    <ProfileField label="Employee type" value={p.employeeType} />
                    <ProfileField label="Employment category" value={p.employmentCategory} />
                    <ProfileField label="Joining date" value={p.joiningDate} />
                    <ProfileField label="Work location" value={p.workLocation} />
                    <ProfileField label="Branch" value={p.branchName} />
                    <ProfileField label="Reporting manager" value={p.reportingManager} />
                    <ProfileField label="Probation period" value={p.probationPeriod} />
                </SectionCard>
            )}

            {showEducation && (
                <SectionCard title="Education">
                    <ProfileField label="Qualification" value={p.higherEducationQualification} />
                    <ProfileField label="Course" value={p.higherEducationCourseName} />
                    <ProfileField label="Institution" value={p.higherEducationInstitution} />
                    <ProfileField label="Passing year" value={p.higherEducationPassingYear} />
                    <ProfileField label="CGPA / percentage" value={p.higherEducationCgpaOrPercentage} />
                    <ProfileField label="Specialization" value={p.higherEducationSpecialization} />
                </SectionCard>
            )}

            {showPrevious && (
                <SectionCard title="Previous employment">
                    <ProfileField label="Company" value={p.previousCompanyName} />
                    <ProfileField label="Designation" value={p.previousDesignation} />
                    <ProfileField label="Salary" value={p.previousSalary} />
                    <ProfileField label="Experience (years)" value={p.workExperienceYears} />
                    <ProfileField label="Joining date" value={p.previousJoiningDate} />
                    <ProfileField label="Relieving date" value={p.previousRelievingDate} />
                    <div className="sm:col-span-2 lg:col-span-3">
                        <ProfileField label="Reason for leaving" value={p.reasonForLeaving} />
                    </div>
                    <ProfileField label="Reference person" value={p.referencePersonName} />
                    <ProfileField label="Reference contact" value={p.referenceContactNumber} />
                </SectionCard>
            )}

            {showIdentity && (
                <SectionCard title="Identity & government details">
                    <ProfileField label="Aadhaar" value={p.aadhaarNumber} />
                    <ProfileField label="PAN" value={p.panNumber} />
                    <ProfileField label="Passport" value={p.passportNumber} />
                    <ProfileField label="Voter ID" value={p.voterIdNumber} />
                    <ProfileField label="Driving license" value={p.drivingLicenseNumber} />
                    <ProfileField label="UAN" value={p.uanNumber} />
                    <ProfileField label="ESIC" value={p.esicNumber} />
                    <ProfileField label="PF" value={p.pfNumber} />
                </SectionCard>
            )}

            {showBank && (
                <SectionCard title="Bank details">
                    <ProfileField label="Bank name" value={p.bankName} />
                    <ProfileField label="Branch" value={p.bankBranchName} />
                    <ProfileField label="Account holder" value={p.accountHolderName} />
                    <ProfileField label="Account number" value={p.accountNumber} />
                    <ProfileField label="IFSC code" value={p.ifscCode} />
                    <ProfileField label="UPI ID" value={p.upiId} />
                </SectionCard>
            )}

            {!hasDetailSections && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 sm:px-6 py-5 text-sm text-amber-800">
                    Your profile details are not filled yet. Tap <strong>Edit profile</strong> to complete your
                    employee record (all fields available in admin employee form).
                </div>
            )}

            <p className="text-xs text-gray-400 flex items-center gap-1.5 pb-2 px-1">
                <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                Use Edit profile to update all employee details. Employee ID cannot be changed.
            </p>

            <EmployeeProfileEditModal
                open={isEditModalOpen}
                employeeId={p.employeeId}
                initialValues={formInitialValues}
                onClose={() => setIsEditModalOpen(false)}
                onSaved={handleProfileSaved}
            />
        </div>
    );
}
