import "dotenv/config";import {submissionGate} from "@job-platform/automation";import {config} from "@job-platform/shared";
const gate=submissionGate({match:91,eligible:true,alreadyApplied:false,supported:true,answersResolved:true,confidence:95,captcha:false,login:false});
console.log(JSON.stringify({level:"INFO",worker_id:"local-worker",event:"application_processed",mode:config.mockMode?"MOCK":"LIVE",result:gate.allowed?"SUBMITTED":"READY_TO_SUBMIT",gates:gate.failures}));
