import { useMemo } from "react";
import { useSetupTreeRevision } from "./useSetupTreeRevision";
import { flattenConfiguredFields } from "../components/common/ConfiguredFormSections";

export function useFormTreeSections(eventName, getSetup, getActiveSections) {
  const setupRevision = useSetupTreeRevision(eventName);
  const formSetup = useMemo(() => {
    void setupRevision;
    return getSetup();
  }, [setupRevision, getSetup]);

  const sections = useMemo(
    () => getActiveSections(formSetup),
    [formSetup, getActiveSections],
  );

  const visibleKeys = useMemo(
    () => new Set(flattenConfiguredFields(sections).map((field) => field.key).filter(Boolean)),
    [sections],
  );

  return { formSetup, sections, visibleKeys };
}
