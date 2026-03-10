
import 'dotenv/config';
import { prisma } from "../src/lib/prisma";
import { appendCase, readCasesByUser } from "../src/lib/cases-store";

async function main() {
  console.log("Starting DB verification...");

  try {
    // 1. Clean up
    await prisma.case.deleteMany();
    await prisma.session.deleteMany();
    await prisma.user.deleteMany();
    console.log("Cleaned up DB.");

    // 2. Create User directly (bypassing auth store to avoid SMS complexity)
    const user = await prisma.user.create({
      data: {
        phone: "13800138000",
        password: "salt:hash", // Mock password
        name: "Test User",
        gender: "男",
      }
    });
    console.log("Created user:", user.id);

    // 3. Test Cases Store
    const caseItem = {
      id: "case-1",
      userId: user.id,
      paradigm: "bazi",
      paradigmLabel: "八字",
      question: "Test Question",
      result: "Test Result",
      createdAt: new Date().toISOString(),
      location: "Beijing",
      currentTime: new Date().toISOString(),
      model: "test-model",
      reference: "ref",
      citations: [],
      foundations: [],
      aiEnhancements: []
    };

    await appendCase(caseItem);
    console.log("Appended case.");

    const cases = await readCasesByUser(user.id);
    console.log("Read cases count:", cases.length);
    
    if (cases.length !== 1) {
      throw new Error(`Expected 1 case, got ${cases.length}`);
    }
    
    if (cases[0].id !== "case-1") {
      throw new Error(`Expected case id 'case-1', got '${cases[0].id}'`);
    }

    if (cases[0].question !== "Test Question") {
      throw new Error("Question mismatch");
    }

    console.log("Verification successful!");
  } catch (error) {
    console.error("Verification failed:", error);
    process.exit(1);
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
