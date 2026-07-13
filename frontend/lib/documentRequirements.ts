export type DocumentCategory = "academic" | "financial" | "identity" | "other";

export type DocumentRequirement = {
  name: string;
  label: string;
  type: string;
  category: DocumentCategory;
  required: boolean;
};

const hasValue = (value: unknown) => String(value || "").trim().length > 0;

export function getDocumentCategory(docType: string): DocumentCategory {
  const type = String(docType || "").toLowerCase();
  if (type.includes("aadhar") || type.includes("aadhaar") || type.includes("pan") || type.includes("passport") || type.includes("identity") || type.includes("national_id")) {
    return "identity";
  }
  if (type.includes("salary") || type.includes("bank") || type.includes("itr") || type.includes("business") || type.includes("balance") || type.includes("retirement") || type.includes("income")) {
    return "financial";
  }
  if (type.includes("marksheet") || type.includes("degree") || type.includes("transcript") || type.includes("test") || type.includes("resume") || type.includes("work")) {
    return "academic";
  }
  return "other";
}

function requirement(name: string, type: string, required = true, category?: DocumentCategory): DocumentRequirement {
  return {
    name,
    label: name,
    type,
    category: category || getDocumentCategory(type),
    required,
  };
}

export function getStudentDocumentRequirements(student: any = {}): DocumentRequirement[] {
  const academic = student.academic || student.student?.academic || {};
  const tests = student.tests || student.testScores || student.student?.tests || {};
  const workExperience = student.workExperience || student.student?.workExperience || [];
  const highestLevel = academic.highestLevel || student.highestLevel || student.courseLevel || student.bachelorsDegree;

  return [
    requirement("Passport (Front & Back)", "passport", true, "identity"),
    requirement("National ID / Aadhar Card", "national_id", true, "identity"),
    requirement("PAN Card", "pan", true, "identity"),
    requirement("10th Marksheet", "marksheet_10", true, "academic"),
    requirement("12th Marksheet", "marksheet_12", highestLevel !== "Grade 10", "academic"),
    requirement("Undergraduate Transcript", "ug_transcript", ["Undergraduate", "Postgraduate"].includes(highestLevel), "academic"),
    requirement("Undergraduate Degree", "ug_degree", ["Undergraduate", "Postgraduate"].includes(highestLevel), "academic"),
    requirement("Postgraduate Transcript", "pg_transcript", highestLevel === "Postgraduate", "academic"),
    requirement("Postgraduate Degree", "pg_degree", highestLevel === "Postgraduate", "academic"),
    requirement("IELTS / TOEFL / PTE Score Card", "english_test", hasValue(tests.ielts) || hasValue(tests.toefl) || hasValue(tests.pte), "academic"),
    requirement("GRE / GMAT / SAT Score Card", "aptitude_test", hasValue(tests.gre) || hasValue(tests.gmat) || hasValue(tests.sat), "academic"),
    requirement("Work Experience Letters", "work_letters", Array.isArray(workExperience) && workExperience.some((exp) => hasValue(exp?.employer)), "academic"),
    requirement("Degree Certificate", "degree_certificate", true, "academic"),
  ].filter((doc) => doc.required);
}

export function getPersonDocumentRequirements(
  employmentType: string,
  personName: string,
  personType: "father" | "mother" | "coapplicant",
): DocumentRequirement[] {
  const docs: DocumentRequirement[] = [];
  const name = personName || (personType === "coapplicant" ? "Co-applicant" : personType[0].toUpperCase() + personType.slice(1));

  docs.push(requirement(`${name}'s Aadhar Card`, `${personType}_aadhar`, true, "identity"));
  docs.push(requirement(`${name}'s PAN Card`, `${personType}_pan`, true, "identity"));

  return docs;
}

export function getProfileDocumentRequirements(profile: any = {}): DocumentRequirement[] {
  const student = profile.student || profile.user || profile;
  const family = student.family || student.familyDetails || profile.family || profile.familyDetails || {};
  const coApplicant = student.coApplicant || profile.coApplicant || {};

  const fatherName = family.fatherName || profile.fatherName;
  const motherName = family.motherName || profile.motherName;
  
  // Dynamically determine relation and fallback co-applicant name
  const rawRelation = coApplicant.relation || coApplicant.coApplicantRelation || profile.coApplicantRelation || student.coApplicant || "";
  const relation = typeof rawRelation === "string" ? rawRelation : "";
  const relationLabel = relation ? relation.charAt(0).toUpperCase() + relation.slice(1) : "Co-applicant";
  const coApplicantName = relationLabel;

  const docs: DocumentRequirement[] = [...getStudentDocumentRequirements(student)];

  // Always collect Father and Mother documents
  docs.push(...getPersonDocumentRequirements(family.fatherEmploymentType || profile.fatherEmploymentType || "", fatherName || "Father", "father"));
  docs.push(...getPersonDocumentRequirements(family.motherEmploymentType || profile.motherEmploymentType || "", motherName || "Mother", "mother"));

  // Collect Co-applicant documents if configured
  if (hasValue(coApplicantName) || hasValue(coApplicant.employmentType) || hasValue(profile.coApplicantEmploymentType) || hasValue(relation)) {
    docs.push(...getPersonDocumentRequirements(coApplicant.employmentType || profile.coApplicantEmploymentType || "", coApplicantName, "coapplicant"));
  }

  const seen = new Set<string>();
  return docs.filter((doc) => {
    if (seen.has(doc.type)) return false;
    seen.add(doc.type);
    return true;
  });
}

export function getDocumentRequirementName(docType: string, fallback?: string, profile?: any): string {
  const match = getProfileDocumentRequirements(profile).find((doc) => doc.type === docType);
  return match?.name || fallback || docType.replace(/_/g, " ");
}
