import { NextRequest } from "next/server";
import { getUserFromRequest, requireAdmin, jsonError } from "@/lib/auth";
import { adminDb } from "@/lib/firebaseAdmin";
import { COL } from "@/lib/firestore";

/*
DEV TESTING ONLY - REMOVE/DISABLE IN PRODUCTION:
curl -X POST http://localhost:3000/api/admin/seed.dev \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json"

CREATED RESOURCES:
- 1 course (unpublished by default)
- 3 modules (index 0, 1, 2)
- Different content types: video, text, pdf

⚠️  WARNING: THIS IS A DEVELOPMENT SEED ROUTE
    REMOVE OR DISABLE THIS IN PRODUCTION ENVIRONMENTS
*/

export async function POST(req: NextRequest) {
  try {
    // Verify admin authorization
    const user = await getUserFromRequest(req);
    requireAdmin(user);

    if (!adminDb) {
      throw Object.assign(new Error("Firebase Admin not initialized"), {
        status: 500,
      });
    }

    const now = new Date();

    // Create sample course
    const courseRef = adminDb.collection(COL.courses).doc();
    const courseId = courseRef.id;

    const courseData = {
      title: "Introduction to AI Fundamentals",
      description:
        "Learn the core concepts of artificial intelligence with practical examples and hands-on exercises.",
      durationMinutes: 180,
      level: "beginner" as const,
      published: false, // Start unpublished
      heroImageUrl:
        "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800",
      moduleCount: 3, // Will be accurate since we're creating 3 modules
      createdAt: now,
      updatedAt: now,
    };

    await courseRef.set(courseData);

    // Create 3 sample modules
    const modules = [
      {
        index: 0,
        title: "Welcome & Overview",
        summary: "Introduction to the course and what you'll learn",
        contentType: "video" as const,
        contentUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        estMinutes: 10,
      },
      {
        index: 1,
        title: "Core AI Concepts",
        summary:
          "Understanding machine learning, neural networks, and key terminology",
        contentType: "text" as const,
        body: `# Core AI Concepts

## Machine Learning
Machine learning is a subset of artificial intelligence that enables computers to learn and improve from experience without being explicitly programmed.

## Neural Networks
Neural networks are computing systems inspired by biological neural networks. They consist of interconnected nodes (neurons) that process information.

## Key Terms
- **Algorithm**: A set of rules or instructions for solving a problem
- **Training Data**: The dataset used to teach the machine learning model
- **Model**: The output of an algorithm run on training data
- **Prediction**: The output of a model when given new data

## Next Steps
In the next module, we'll explore practical applications of these concepts.`,
        estMinutes: 25,
      },
      {
        index: 2,
        title: "Practical Applications",
        summary: "Real-world examples and case studies of AI in action",
        contentType: "pdf" as const,
        contentUrl: "https://example.com/ai-applications-guide.pdf",
        estMinutes: 30,
      },
    ];

    const moduleIds = [];
    for (const moduleTemplate of modules) {
      const moduleRef = adminDb.collection(COL.modules).doc();
      const moduleId = moduleRef.id;

      const moduleData = {
        courseId,
        ...moduleTemplate,
        published: false, // Match course published status
        updatedAt: now,
      };

      await moduleRef.set(moduleData);
      moduleIds.push(moduleId);
    }

    // ⚠️  PRODUCTION WARNING:
    console.warn("🚨 DEVELOPMENT SEED ROUTE USED - DISABLE IN PRODUCTION 🚨");

    return Response.json({
      ok: true,
      warning:
        "Development seed data created - REMOVE THIS ROUTE IN PRODUCTION",
      created: {
        courseId,
        courseTitle: courseData.title,
        moduleIds,
        moduleCount: modules.length,
        published: courseData.published,
      },
      nextSteps: [
        `Use POST /api/admin/course.publish with courseId=${courseId} to publish`,
        "Then users can enroll and complete modules",
        "Test progress tracking with /api/enroll and /api/progress",
      ],
    });
  } catch (error) {
    console.error("Seed development data error:", error);
    return jsonError(error);
  }
}
