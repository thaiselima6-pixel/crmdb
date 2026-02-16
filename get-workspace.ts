import { prisma } from "./src/lib/prisma";

async function main() {
  const workspace = await prisma.workspace.findFirst();
  if (!workspace) {
    console.log("Nenhum workspace encontrado.");
    return;
  }
  console.log("WORKSPACE_ID=" + workspace.id);
}

main();
