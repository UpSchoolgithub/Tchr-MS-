const { Sequelize } = require('sequelize');
const db = require('./models'); // Ensure the correct path to your models

(async () => {
  console.log("\n--- Sequelize Associations Debugging ---");

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
          as: 'PlanTopics', // Ensure that this alias matches the one defined in your `Topic` model association
          required: false,
          include: [
            {
              model: db.Concept,
              as: 'TopicConcepts', // Ensure that this alias matches the one in your `Concept` model
              required: false,
            },
          ],
        },
      ],
    });

    if (!result) {
      console.log("❌ No SessionPlan found. Possibly empty table.");
    } else {
      console.log("✅ Association query ran successfully. Associations are correctly defined.");
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error("❌ Error during association check:", error.message);
    console.error("Stack:", error.stack);

    // Specific check for include errors
    if (error.message.includes("Include unexpected")) {
      console.log("\n[DEBUG] Check that the include elements reference correct models and aliases.\n");
      console.log("Ensure that the following points are verified:");
      console.log("- The alias ('as') matches the one defined in the Sequelize associations.");
      console.log("- The associations (belongsTo, hasMany, hasOne) have been correctly set.");
      console.log("- The model exports are structured correctly in ./models/index.js.");
    }
  }

  process.exit(0);
})();
