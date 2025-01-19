import express from "express";
import Result from "../models/resultSchema.js";
import AccessCode from "../models/accessCodeSchema.js";
import ActiveSession from "../models/activeSession.js";
import jwt from "jsonwebtoken";
import { auth, checkRole } from "../middleware/auth.js";
import {
  AptitudeQuestion,
  CoreQuestion,
  VerbalQuestion,
  ProgrammingQuestion,
} from "../models/questionSchema.js";
import GeneratedQuestions from "../models/generatedQuestionsSchema.js";
import Comprehension from "../models/comprehensionSchema.js";
import { body, validationResult } from "express-validator";
const router = express.Router();

// Search user by email only
router.get("/search", async (req, res) => {
  try {
    const { email } = req.query;

    console.log("\n=== Search Request ===");
    console.log("Email:", email);

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Check both Result and ActiveSession collections
    const completedUser = await Result.findOne({ email: email.trim() });
    const activeUser = await ActiveSession.findOne({ email: email.trim() });

    console.log("Search results:", {
      completedUser: !!completedUser,
      activeUser: !!activeUser,
    });

    // If user not found in either collection
    if (!completedUser && !activeUser) {
      console.log("No user found in either collection");
      return res.status(404).json({
        message: `No user found with email: ${email}`,
      });
    }

    // Prepare response data
    let userData = {
      email: email,
      status: completedUser
        ? "completed"
        : activeUser
        ? "in_progress"
        : "not_found",
    };

    // Add completed test data if available
    if (completedUser) {
      userData = {
        ...userData,
        name: completedUser.username,
        regNo: completedUser.regNo,
        department: completedUser.dept,
        score: completedUser.points ? `${completedUser.points}` : "0",
        totalQuestions: completedUser.totalQuestions || 50,
      };
    }

    // Add active session data if available
    if (activeUser) {
      console.log("Active user found:", activeUser);
      userData = {
        ...userData,
        regNo: activeUser.regNo,
        startTime: activeUser.startTime,
        sessionExpiresAt: activeUser.expiresAt,
      };
    }

    console.log("\nSending user data:", userData);
    res.json(userData);
  } catch (error) {
    console.error("\nSearch error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.post("/verify-user", async (req, res) => {
  try {
    const { email, regNo } = req.body;

    // Check if user already exists
    const existingUser = await Result.findOne({
      $or: [{ email: email }, { regNo: regNo }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "A user with this email or registration number has already taken the test",
      });
    }

    res.json({ message: "User can take the test" });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-test", async (req, res) => {
  try {
    const { email } = req.body;

    console.log("Received reset request for email:", email);

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    // Find and delete the user from results collection
    const deletedUser = await Result.findOneAndDelete({ email: email });

    if (!deletedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    console.log("User deleted successfully:", deletedUser);

    res.json({
      message: "Test reset successfully",
      status: "success",
    });
  } catch (error) {
    console.error("Reset error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Add this new route for checking if user has already taken the test
router.post("/check-user", async (req, res) => {
  try {
    const { email, regNo } = req.body;

    console.log("Checking user:", { email, regNo });

    if (!email || !regNo) {
      return res.status(400).json({
        message: "Both email and registration number are required",
      });
    }

    // Check if user exists with either email or regNo
    const existingUser = await Result.findOne({
      $or: [{ email: email }, { regNo: regNo }],
    });

    if (existingUser) {
      return res.status(400).json({
        message:
          "You have already taken the test. Each user can only take the test once.",
        alreadyTaken: true,
      });
    }

    res.json({
      message: "User can proceed with the test",
      canTakeTest: true,
    });
  } catch (error) {
    console.error("User check error:", error);
    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

router.post("/verify-code", async (req, res) => {
  try {
    const { accessCode } = req.body;
    const validCode = await AccessCode.findOne({
      code: accessCode,
      isActive: true,
    });

    res.json({ valid: !!validCode });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/admin/current-code", async (req, res) => {
  try {
    const currentCode = await AccessCode.findOne({ isActive: true });
    res.json({ code: currentCode?.code || "No active code" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/admin/update-code", async (req, res) => {
  try {
    const { code } = req.body;

    // Deactivate current code
    await AccessCode.updateMany({}, { isActive: false });

    // Create new code
    await AccessCode.create({ code, isActive: true });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Add this new route for initializing a default code
router.post("/admin/init-code", async (req, res) => {
  try {
    // Check if any active code exists
    const existingCode = await AccessCode.findOne({ isActive: true });

    if (!existingCode) {
      // Create default code if none exists
      await AccessCode.create({
        code: "SVCE2024", // Default code
        isActive: true,
      });
      res.json({ message: "Default access code created: SVCE2024" });
    } else {
      res.json({
        message: "Access code already exists",
        code: existingCode.code,
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// Check if user has an active session or has completed test
router.post(
  "/check-session",
  [
    body("email")
      .exists()
      .withMessage("Email is required")
      .matches(/^2022[a-zA-Z]{2}\d{4}@svce\.ac\.in$/)
      .withMessage("Email must be in format 2022XX1234@svce.ac.in"),
    body("regNo")
      .exists()
      .withMessage("Registration number is required")
      .matches(/^212722\d{7}$/)
      .withMessage(
        "Registration number must be 13 digits and start with 212722"
      ),
    body("department")
      .exists()
      .withMessage("Department is required")
      .isString()
      .withMessage("Department must be a string")
      .isIn([
        "aids",
        "auto",
        "bio",
        "chem",
        "civil",
        "cs",
        "ee",
        "ec",
        "marine",
        "mech",
        "it",
      ])
      .withMessage("Invalid department"),
    body("accessCode")
      .exists()
      .withMessage("Access code is required")
      .isString()
      .withMessage("Access code must be a string"),
    body("username")
      .exists()
      .withMessage("Name is required")
      .isString()
      .withMessage("Name must be a string")
      .trim()
      .isLength({ min: 2 })
      .withMessage("Name must be at least 2 characters long"),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          message: "Validation failed",
          errors: errors.array(),
        });
      }

      const { email, regNo, department, accessCode, username } = req.body;

      // Verify access code
      const validCode = await AccessCode.findOne({
        code: accessCode,
        isActive: true,
      });

      if (!validCode) {
        return res.status(400).json({ message: "Invalid access code" });
      }

      // First check if user has already completed the test
      const existingResult = await Result.findOne({
        $or: [{ email: email }, { regNo: regNo }],
      });
      if (existingResult) {
        return res.json({
          canTakeTest: false,
          hasActiveSession: false,
          message: "User has already completed the test",
        });
      }

      // Then check for active session
      const activeSession = await ActiveSession.findOne({
        $or: [{ email: email }, { regNo: regNo }],
      });
      if (activeSession) {
        return res.json({
          canTakeTest: true,
          hasActiveSession: true,
          message: "User has an active session",
        });
      }

      const token = jwt.sign(
        { email, regNo, department, username, role: "student" },
        process.env.JWT_SECRET,
        { expiresIn: "24h" }
      );

      return res.json({
        canTakeTest: true,
        hasActiveSession: false,
        message: "User can take test",
        token: token,
        role: "student",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Create a new session when user starts test
router.post(
  "/create-session",
  auth,
  checkRole(["student"]),
  async (req, res) => {
    try {
      const { email, regNo, department } = req.user;

      const newSession = new ActiveSession({
        email,
        regNo,
        startTime: new Date(),
      });

      await newSession.save();

      // Fetch random questions for each category
      const [
        aptitudeQuestions,
        coreQuestions,
        verbalQuestions,
        programmingQuestions,
        comprehensionQuestions,
      ] = await Promise.all([
        // 10 random aptitude questions
        AptitudeQuestion.aggregate([{ $sample: { size: 10 } }]),
        // 20 random core questions matching department
        CoreQuestion.aggregate([
          { $match: { category: department } },
          { $sample: { size: 20 } },
        ]),
        // 5 random verbal questions
        VerbalQuestion.aggregate([{ $sample: { size: 5 } }]),
        // 10 random programming questions
        ProgrammingQuestion.aggregate([{ $sample: { size: 10 } }]),
        // 1 random comprehension question
        Comprehension.aggregate([{ $sample: { size: 1 } }]),
      ]);

      // Create new generated questions document
      const generatedQuestions = new GeneratedQuestions({
        regNo,
        email,
        department,
        aptitudeQuestions: aptitudeQuestions.map((q) => q._id),
        coreQuestions: coreQuestions.map((q) => q._id),
        verbalQuestions: verbalQuestions.map((q) => q._id),
        programmingQuestions: programmingQuestions.map((q) => q._id),
        comprehensionQuestions: comprehensionQuestions.map((q) => q._id),
      });

      await generatedQuestions.save();

      // Prepare questions data for response
      const questionsData = {
        aptitude: aptitudeQuestions.map((q) => ({
          question: q.question,
          options: q.options.map((opt, i) =>
            i === q.correctAnswer ? opt + " *" : opt
          ),
          image: q.image || null,
        })),
        core: coreQuestions.map((q) => ({
          question: q.question,
          options: q.options.map((opt, i) =>
            i === q.correctAnswer ? opt + " *" : opt
          ),
          image: q.image || null,
        })),
        verbal: verbalQuestions.map((q) => ({
          question: q.question,
          options: q.options.map((opt, i) =>
            i === q.correctAnswer ? opt + " *" : opt
          ),
          image: q.image || null,
        })),
        programming: programmingQuestions.map((q) => ({
          question: q.question,
          options: q.options.map((opt, i) =>
            i === q.correctAnswer ? opt + " *" : opt
          ),
          image: q.image || null,
        })),
        comprehension: comprehensionQuestions.map((q) => ({
          passage: q.passage,
          image: q.image || null,
          q1: {
            question: q.q1.question,
            options: q.q1.options.map((opt, i) =>
              i === q.q1.correctAnswer ? opt + " *" : opt
            ),
          },
          q2: {
            question: q.q2.question,
            options: q.q2.options.map((opt, i) =>
              i === q.q2.correctAnswer ? opt + " *" : opt
            ),
          },
          q3: {
            question: q.q3.question,
            options: q.q3.options.map((opt, i) =>
              i === q.q3.correctAnswer ? opt + " *" : opt
            ),
          },
          q4: {
            question: q.q4.question,
            options: q.q4.options.map((opt, i) =>
              i === q.q4.correctAnswer ? opt + " *" : opt
            ),
          },
          q5: {
            question: q.q5.question,
            options: q.q5.options.map((opt, i) =>
              i === q.q5.correctAnswer ? opt + " *" : opt
            ),
          },
        })),
      };

      res.json({
        message: "Session created successfully",
        questions: questionsData,
      });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

router.post("/submit-test", auth, checkRole(["student"]), async (req, res) => {
  try {
    const { email, regNo } = req.user;
    const { answers } = req.body;

    // Get the generated questions for this user
    const generatedQuestions = await GeneratedQuestions.findOne({
      email,
      regNo,
    });
    if (!generatedQuestions) {
      return res
        .status(404)
        .json({ message: "No generated questions found for this user" });
    }

    // Populate all question types with their full data
    await generatedQuestions.populate([
      { path: "aptitudeQuestions", model: AptitudeQuestion },
      { path: "coreQuestions", model: CoreQuestion },
      { path: "verbalQuestions", model: VerbalQuestion },
      { path: "programmingQuestions", model: ProgrammingQuestion },
      { path: "comprehensionQuestions", model: Comprehension },
    ]);

    let totalPoints = 0;
    let resultArray = [];

    // Calculate points for each question type
    const questionTypes = [
      {
        key: "aptitude",
        questions: generatedQuestions.aptitudeQuestions,
        points: 1,
      },
      { key: "core", questions: generatedQuestions.coreQuestions, points: 1 },
      {
        key: "verbal",
        questions: generatedQuestions.verbalQuestions,
        points: 1,
      },
      {
        key: "programming",
        questions: generatedQuestions.programmingQuestions,
        points: 1,
      },
    ];

    // Process regular questions (aptitude, core, verbal, programming)
    for (const type of questionTypes) {
      const userAnswers = answers[type.key] || [];
      let sectionPoints = 0;

      type.questions.forEach((question, index) => {
        const isCorrect = userAnswers[index] === question.correctAnswer;
        const pointsEarned = isCorrect ? type.points : 0;
        sectionPoints += pointsEarned;
        resultArray.push({
          question: question.question,
          submitted: userAnswers[index],
          correct: question.correctAnswer,
          points: pointsEarned,
        });
      });
      totalPoints += sectionPoints;
    }

    // Process comprehension questions
    const comprehension = generatedQuestions.comprehensionQuestions[0];
    const comprehensionAnswers = answers.comprehension || [];
    let comprehensionPoints = 0;

    ["q1", "q2", "q3", "q4", "q5"].forEach((q, index) => {
      const isCorrect =
        comprehensionAnswers[index] === comprehension[q].correctAnswer;
      const pointsEarned = isCorrect ? 1 : 0;
      comprehensionPoints += pointsEarned;
      resultArray.push({
        question: comprehension[q].question,
        submitted: comprehensionAnswers[index],
        correct: comprehension[q].correctAnswer,
        points: pointsEarned,
      });
    });
    totalPoints += comprehensionPoints;

    // Calculate total questions
    const totalQuestions = resultArray.length;

    // Create result document
    const result = new Result({
      username: req.user.username || "Anonymous",
      email,
      regNo,
      dept: req.user.department,
      points: totalPoints,
      attempts: 1,
      totalQuestions,
      result: resultArray,
    });

    await result.save();

    // Clear the active session
    await ActiveSession.findOneAndDelete({ email, regNo });

    // Delete generated questions
    await GeneratedQuestions.findOneAndDelete({ email, regNo });

    res.json({
      message: "Test submitted successfully",
    });
  } catch (error) {
    console.error("Test submission error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Check if user has an active session (admin route)
router.get(
  "/check-active-session",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { email } = req.query;
      const activeSession = await ActiveSession.findOne({ email });

      res.json({
        hasActiveSession: !!activeSession,
        sessionDetails: activeSession,
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Admin route to clear active session
router.post(
  "/admin-clear-session",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { email } = req.body;
      await ActiveSession.findOneAndDelete({ email });

      res.json({
        message: "Active session cleared successfully",
        status: "success",
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Add this new route to check test status
router.get(
  "/check-test-status",
  auth,
  checkRole(["admin"]),
  async (req, res) => {
    try {
      const { email, regNo } = req.query;

      // Check if the user has a completed test
      const completedTest = await Result.findOne({ email, regNo });

      // Check if user has an active session
      const activeSession = await ActiveSession.findOne({ email, regNo });

      res.json({
        hasCompletedTest: !!completedTest || !activeSession,
        status: completedTest
          ? "completed"
          : activeSession
          ? "in_progress"
          : "not_found",
      });
    } catch (error) {
      console.error("Test status check error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

export { router };
