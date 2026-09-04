import React from "react";
import { Navigate, useParams } from "react-router-dom";
import { getDropdownOptionBySlug } from "./dropdownOptionCatalog";
import { isManagedDropdownOption } from "../../../mockdata/setups/dropdownOptionsStore";
import { isApiBackedCatalogOption } from "../../../services/catalogOptionsCache";
import ManagedDropdownOptionList from "./ManagedDropdownOptionList";
import PageHeader from "../../../components/common/PageHeader";
import BackToDropdownOptionsLink from "../components/BackToDropdownOptionsLink";
import AccessDenied from "../../../components/common/AccessDenied";
import { usePermission } from "../../../hooks/usePermission";
import { canReadDropdownOption } from "../../../permissions/accessMap";

export default function DropdownOptionPlaceholder() {
  const { optionSlug } = useParams();
  const { can } = usePermission();
  const option = getDropdownOptionBySlug(optionSlug);
  const isKnownOption =
    Boolean(optionSlug)
    && (isManagedDropdownOption(optionSlug) || isApiBackedCatalogOption(optionSlug));

  if (isKnownOption && !canReadDropdownOption(can, optionSlug)) {
    return (
      <div className="space-y-6 pb-8">
        <BackToDropdownOptionsLink />
        <AccessDenied description="You don't have permission to view this dropdown list." />
      </div>
    );
  }

  if (isKnownOption) {
    return (
      <ManagedDropdownOptionList
        optionId={optionSlug}
        title={option?.title ?? "Dropdown Option"}
      />
    );
  }

  if (optionSlug && !option) {
    return <Navigate to="/setups?tab=dropdown" replace />;
  }

  return (
    <div className="space-y-6 pb-8">
      <BackToDropdownOptionsLink />
      <PageHeader
        title={option?.title ?? "Dropdown Option"}
        description={`${option?.title ?? "This dropdown option"} setup is under development.`}
      />
    </div>
  );
}
