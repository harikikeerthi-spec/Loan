export class CreateCohortApplicationDto {
    fullName: string;
    email: string;
    phone: string;
    targetIntake: string;
    destination?: string;
    university?: string;
    course?: string;
    gapYear?: boolean;
    message?: string;
    source?: string;
}
