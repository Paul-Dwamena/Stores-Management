import React from "react";
import { useParams } from "react-router-dom";
import { getDropdownOptionBySlug } from "./dropdownOptionCatalog";
import { isManagedDropdownOption } from "../../../mockdata/setups/dropdownOptionsStore";
import { isApiBackedCatalogOption } from "../../../services/catalogOptionsCache";
import ManagedDropdownOptionList from "./ManagedDropdownOptionList";
import PageHeader from "../../../components/common/PageHeader";
import BackToDropdownOptionsLink from "../components/BackToDropdownOptionsLink";

export default function DropdownOptionPlaceholder() {
  const { optionSlug } = useParams();
  const option = getDropdownOptionBySlug(optionSlug);

  if (
    optionSlug
    && (isManagedDropdownOption(optionSlug) || isApiBackedCatalogOption(optionSlug))
  ) {
    return (
      <ManagedDropdownOptionList
        optionId={optionSlug}
        title={option?.title ?? "Dropdown Option"}
      />
    );
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
