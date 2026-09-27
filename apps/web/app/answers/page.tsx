import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AnswersManager } from "@/components/answers-manager";

export default async function Answers() {
	const session = await getSession();
	if (!session) return <><header className="page-heading"><div><p className="eyebrow">APPLICATION DATA</p><h1>Saved answers</h1><p>Sign in to manage information used in application forms.</p></div></header></>;
	const answers = await prisma.answer.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
	return <><header className="page-heading"><div><p className="eyebrow">APPLICATION DATA</p><h1>Saved answers</h1><p>Save accurate details for reuse. Only mark answers verified after checking them yourself.</p></div></header><AnswersManager initialAnswers={answers.map(({ id, question, answer, category, verified }) => ({ id, question, answer, category, verified }))}/></>;
}
