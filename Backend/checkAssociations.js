const { Sequelize } = require('sequelize');
const db = require('./models'); // Ensure the correct path to your models

(async () => {
  console.log("\n--- Sequelize Associations Check ---");

  try {
    await db.sequelize.authenticate(); // Test DB connection
    console.log("Database connected successfully.");
  } catch (error) {
    console.error("Database connection failed:", error.message);
    process.exit(1);
  }

  console.log("\nVerifying associations:");

  const modelNames = Object.keys(db).filter(
    (name) => name !== "sequelize" && name !== "Sequelize"
  );

  for (const modelName of modelNames) {
    const model = db[modelName];
    if (model.associate) {
      try {
        console.log(`[INFO] Associating ${modelName}...`);
        model.associate(db); // Invoke the associate function
      } catch (error) {
        console.error(`❌ Missing association: ${modelName}`, error.message);
      }
    } else {
      console.warn(`[WARNING] No associate method in ${modelName}`);
    }
  }

  console.log("\n--- Testing Query with Include ---");
  try {
    const result = await db.SessionPlan.findOne({
        include: [
          {
            model: db.Topic,
            as: 'PlanTopics', // Updated alias
            include: [{ model: db.Concept, as: 'TopicConcepts' }], // Updated alias
          },
        ],
      });
      

    if (!result) {
      console.log("❌ No SessionPlan found. Possibly empty table.");
    } else {
      console.log("✅ Association query ran successfully. Associations are correctly defined.");
    }
  } catch (error) {
    console.error("❌ Error during association check:", error.stack);
  }

  process.exit(0);
})();
