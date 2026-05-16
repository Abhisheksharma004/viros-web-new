"use client";

import { Settings } from "lucide-react";
import EmployeeAssetWorkPanel from "@/components/employee-dashboard/EmployeeAssetWorkPanel";

export default function AmcWorkPage() {
    return (
        <EmployeeAssetWorkPanel
            title="AMC Work"
            description="Scan a barcode or enter a tag / serial to load asset details and record AMC service notes."
            workType="amc"
            icon={Settings}
        />
    );
}
