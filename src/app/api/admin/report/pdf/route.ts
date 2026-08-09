import { requireApiSession } from "@/lib/api-auth";
import { db } from "@/db";
import {
  authUser,
  completion,
  event,
  prize,
  task,
  winner,
} from "@/db/schema";
import { asc, desc, eq } from "drizzle-orm";
import { EVENT_ID } from "@/lib/event";
import "@/lib/pdf";
import PDFDocument from "pdfkit";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireApiSession("admin");
  if (!auth.ok) return auth.response;

  const [evt, participants, completions, tasks, prizes, winners] =
    await Promise.all([
      db.select().from(event).where(eq(event.id, EVENT_ID)).limit(1),
      db
        .select({
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          phone: authUser.phone,
          instagram: authUser.instagram,
          totalPoints: authUser.totalPoints,
        })
        .from(authUser)
        .where(eq(authUser.role, "participant"))
        .orderBy(desc(authUser.totalPoints)),
      db.select().from(completion),
      db.select().from(task),
      db.select().from(prize).where(eq(prize.active, true)).orderBy(asc(prize.placement)),
      db.select().from(winner).orderBy(asc(winner.rank)),
    ]);

  const eventRow = evt[0] ?? null;
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  // Ranking com empates
  let rank = 0;
  let lastPoints: number | null = null;
  const ranking = participants.map((p, i) => {
    if (p.totalPoints !== lastPoints) {
      rank = i + 1;
      lastPoints = p.totalPoints;
    }
    return { ...p, rank };
  });

  const winnerByUser = new Map(winners.map((w) => [w.userId, w]));

  const doc = new PDFDocument({ size: "A4", margin: 40 });
  const chunks: Buffer[] = [];
  doc.on("data", (c) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
  });

  const GOLD = "#bc9c25";
  const BLUE = "#3c71c8";
  const DARK = "#070a23";
  const GRAY = "#666666";

  // ===== Capa / cabeçalho =====
  doc.rect(0, 0, doc.page.width, 90).fill(DARK);
  doc
    .fillColor(GOLD)
    .fontSize(22)
    .font("Helvetica-Bold")
    .text("Desafio JM Fitness", 40, 30);
  doc
    .fillColor("#ffffff")
    .fontSize(12)
    .font("Helvetica")
    .text("Relatório do Evento de Ativação de Suplementos", 40, 60);
  doc
    .fillColor("#cccccc")
    .fontSize(9)
    .text(
      `Gerado em ${new Date().toLocaleString("pt-BR")} · Status: ${
        eventRow?.status === "closed" ? "Encerrado" : "Em andamento"
      }`,
      40,
      76
    );

  let y = 120;

  // ===== Resumo =====
  doc.fillColor(DARK).fontSize(14).font("Helvetica-Bold").text("Resumo do evento", 40, y);
  y += 24;
  const totalPoints = participants.reduce(
    (acc, p) => acc + (p.totalPoints ?? 0),
    0
  );
  const approved = completions.filter((c) => c.status === "approved").length;
  const pending = completions.filter((c) => c.status === "pending").length;

  const summary = [
    ["Participantes", String(participants.length)],
    ["Pontos totais emitidos", String(totalPoints)],
    ["Tarefas concluídas", String(approved)],
    ["Aguardando confirmação", String(pending)],
    ["Tarefas cadastradas", String(tasks.length)],
  ];
  doc.font("Helvetica").fontSize(10);
  for (const [label, value] of summary) {
    doc.fillColor(GRAY).text(label, 40, y);
    doc.fillColor(DARK).text(value, 200, y);
    y += 16;
  }

  // ===== Vencedores =====
  if (winners.length > 0) {
    y += 10;
    doc.fillColor(DARK).fontSize(14).font("Helvetica-Bold").text("Vencedores", 40, y);
    y += 24;
    doc.font("Helvetica").fontSize(10);
    for (const w of winners) {
      const user = participants.find((p) => p.id === w.userId);
      doc
        .fillColor(GOLD)
        .font("Helvetica-Bold")
        .text(`${w.rank}º lugar`, 40, y);
      doc
        .fillColor(DARK)
        .font("Helvetica")
        .text(
          `${user?.name ?? "Participante"} — ${w.prizeName ?? "Prêmio"} (${w.totalPoints} pts)`,
          100,
          y
        );
      y += 16;
    }
  }

  // ===== Ranking =====
  y += 10;
  doc.fillColor(DARK).fontSize(14).font("Helvetica-Bold").text("Ranking final", 40, y);
  y += 24;
  doc.font("Helvetica").fontSize(10);
  for (const p of ranking) {
    const w = winnerByUser.get(p.id);
    const prizeText = w ? ` — ${w.prizeName}` : "";
    doc
      .fillColor(GRAY)
      .text(`${p.rank}º`, 40, y);
    doc
      .fillColor(DARK)
      .text(`${p.name}${prizeText}`, 70, y);
    doc
      .fillColor(BLUE)
      .text(`${p.totalPoints} pts`, 480, y, { width: 70, align: "right" });
    y += 16;
    if (y > 760) {
      doc.addPage();
      y = 40;
    }
  }

  // ===== Detalhe por participante (atividades + respostas) =====
  for (const p of ranking) {
    if (y > 700) {
      doc.addPage();
      y = 40;
    }
    y += 10;
    doc
      .fillColor(BLUE)
      .fontSize(13)
      .font("Helvetica-Bold")
      .text(`${p.name} (${p.totalPoints} pts)`, 40, y);
    y += 16;
    doc
      .fillColor(GRAY)
      .fontSize(9)
      .font("Helvetica")
      .text(
        `${p.email}${p.phone ? ` · ${p.phone}` : ""}${
          p.instagram ? ` · @${p.instagram}` : ""
        }`,
        40,
        y
      );
    y += 18;

    const acts = completions.filter((c) => c.userId === p.id);
    if (acts.length === 0) {
      doc.fillColor(GRAY).fontSize(9).text("Nenhuma atividade registrada.", 40, y);
      y += 14;
    } else {
      for (const c of acts) {
        if (y > 740) {
          doc.addPage();
          y = 40;
        }
        const t = taskById.get(c.taskId);
        const statusLabel =
          c.status === "approved"
            ? "Concluída"
            : c.status === "pending"
              ? "Pendente"
              : "Rejeitada";
        doc
          .fillColor(DARK)
          .fontSize(10)
          .font("Helvetica-Bold")
          .text(`• ${t?.title ?? "Tarefa removida"}`, 40, y);
        doc
          .fillColor(GRAY)
          .fontSize(9)
          .font("Helvetica")
          .text(
            `${statusLabel} · ${c.pointsAwarded} pts · ${new Date(
              c.createdAt
            ).toLocaleString("pt-BR")}`,
            40,
            y + 12
          );
        y += 26;

        // Respostas do formulário
        if (c.payload && typeof c.payload === "object") {
          const entries = Object.entries(c.payload as Record<string, unknown>);
          if (entries.length > 0) {
            for (const [key, value] of entries) {
              if (y > 740) {
                doc.addPage();
                y = 40;
              }
              const label = key;
              const val =
                typeof value === "boolean"
                  ? value
                    ? "Sim"
                    : "Não"
                  : String(value ?? "");
              doc
                .fillColor(GRAY)
                .fontSize(9)
                .text(`   ${label}: ${val}`, 40, y);
              y += 13;
            }
          }
        }
        if (c.adminNote) {
          doc
            .fillColor(GRAY)
            .fontSize(9)
            .text(`   Nota do admin: ${c.adminNote}`, 40, y);
          y += 13;
        }
      }
    }
  }

  // ===== Rodapé (adicionado a cada página conforme é criada) =====
  let pageCount = 0;
  doc.on("pageAdded", () => {
    pageCount++;
    doc
      .fillColor(GRAY)
      .fontSize(8)
      .text(
        `Desafio JM Fitness · Página ${pageCount}`,
        40,
        doc.page.height - 30,
        { align: "center" }
      );
  });

  doc.end();
  const buffer = await done;

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="relatorio-evento-jm.pdf"',
    },
  });
}
