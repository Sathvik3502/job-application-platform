export type ApplicationStatus="DISCOVERED"|"MATCHED"|"ELIGIBLE"|"SKIPPED"|"QUEUED"|"PREPARING"|"READY_FOR_REVIEW"|"APPROVED"|"APPLYING"|"READY_TO_SUBMIT"|"SUBMITTED"|"FAILED"|"MANUAL_REVIEW"|"INTERVIEW"|"REJECTED"|"OFFER"|"MOCK_SUBMITTED";
export type EligibilityStatus="ELIGIBLE"|"INELIGIBLE"|"MANUAL_REVIEW"|"UNKNOWN";
export interface CandidateProfile{fullName:string;email:string;phone?:string;location:string;skills:string[];titles:string[];yearsExperience:number;workAuthorized?:boolean;minSalary?:number;}
export interface Job{ id:string; company:string; title:string; location:string; remote:boolean; description:string; requirements:string[]; salary?:number; source:string; applicationUrl:string; postedAt:string; jobHash:string; }
export interface MatchResult{overall:number;skills:number;experience:number;role:number;location:number;domain:number;education:number;salary:number;matchedSkills:string[];missingSkills:string[];evidence:string[];confidence:number;}
export const config={minimumScore:Number(process.env.MATCH_THRESHOLD??70),autoApplyThreshold:Number(process.env.AUTO_APPLY_THRESHOLD??85),dryRun:process.env.DRY_RUN!=="false",mockMode:process.env.MOCK_MODE!=="false",automationEnabled:process.env.AUTOMATION_ENABLED==="true",autoApplyEnabled:process.env.AUTO_APPLY_ENABLED==="true"};
export const normalize=(value:string)=>value.toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
export const fingerprint=(job:Pick<Job,"company"|"title"|"location"|"applicationUrl">)=>[job.company,job.title,job.location,job.applicationUrl].map(normalize).join("|");
