const { sequelize, SessionPlan, Topic, Concept, LessonPlan } = require('./models');

(async () => {
  console.log("\n--- Sequelize Association Diagnostics ---");

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connected successfully.\n");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }

  console.log("Checking associations for models...\n");

  // List models to check their associations
  const modelsToCheck = { SessionPlan, Topic, Concept, LessonPlan };
  
  for (const [modelName, model] of Object.entries(modelsToCheck)) {
    if (!model) {
      console.warn(`❌ Model ${modelName} is undefined. Check if the model is imported and exported correctly.`);
      continue;
    }
    console.log(`Checking ${modelName} associations:`);
    if (model.associations) {
      console.log(model.associations);
    } else {
      console.warn(`❌ No associations found for ${modelName}`);
    }
  }
  

  console.log("\n--- Running Route Query Test ---\n");

  try {
    // Simulate the query used in the route
    const sessionPlans = await SessionPlan.findAll({
      where: { sessionId: 1 }, // Example ID; replace with your test value
      include: [
        {
          model: Topic,
          as: 'Topics', // Must match `as` defined in associations
          include: [
            {
              model: Concept,
              as: 'Concepts', // Must match `as` defined in associations
            },
          ],
        },
      ],
    });

    console.log(`✅ Query ran successfully. Found ${sessionPlans.length} session plans.\n`);
  } catch (error) {
    console.error("❌ Error during query execution:", error.message);
    if (error.stack.includes('Include unexpected')) {
      console.error("🛑 Include mismatch detected. Check that your aliases (as) match the associations in the models.");
    } else {
      console.error("Stack trace:", error.stack);
    }
  }

  console.log("\n--- Suggested Fixes ---\n");
  console.log("1. Ensure 'as' values in the query match the 'as' in model associations.");
  console.log("2. Ensure all required models are imported and exported in the models/index.js.");
  console.log("3. Verify that models have their associate methods properly defined.\n");

  process.exit(0);
})();
