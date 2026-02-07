import { z } from "zod";

// User Schema matching actual Firestore structure
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  serial: z.string(), // Changed from serialNumber to match Firestore
  currentStage: z
    .number()
    .min(1)
    .max(8)
    .refine((v) => Number.isInteger(v) || v === 7.5), // Changed from stage to match Firestore
  progress: z
    .object({
      openedCourses: z.array(z.number()).default([]),
      completedExams: z.array(z.number()).default([]),
      scores: z.array(z.number()).default([]),
    })
    .optional()
    .default({
      openedCourses: [],
      completedExams: [],
      scores: [],
    }),
  trainingProgress: z
    .object({
      courses: z
        .record(
          z.string(),
          z.object({
            startedAt: z.number().optional(),
            readParts: z.array(z.number()).optional().default([]),
            passedParts: z.array(z.number()).optional().default([]),
            completedAt: z.number().optional(),
          })
        )
        .default({}),
      completedCourses: z.array(z.number()).default([]),
    })
    .optional()
    .default({
      courses: {},
      completedCourses: [],
    }),
});

export type User = z.infer<typeof userSchema>;

// Course Schema
export const coursePartSchema = z.object({
  id: z.number(),
  title: z.string(),
  pdfPath: z.string(),
});

export const courseSchema = z.object({
  id: z.number(),
  title: z.string(),
  parts: z.array(coursePartSchema),
});

export type CoursePart = z.infer<typeof coursePartSchema>;
export type Course = z.infer<typeof courseSchema>;

// Login Request Schema
export const barcodeLoginSchema = z.object({
  barcodeNumber: z.string(),
});

export type BarcodeLogin = z.infer<typeof barcodeLoginSchema>;

// Course Content Sections
export type CourseSection = "training" | "exams" | "certificates";

const part = (courseId: number, id: number, title: string): CoursePart => ({
  id,
  title,
  pdfPath: `/pdfs/${courseId}/part-${String(id).padStart(2, "0")}.pdf`,
});

// All 8 courses data
export const courses: Course[] = [
  {
    id: 1,
    title: "دورة تدريب الجوالة الجدد",
    parts: [
      part(1, 1, "الباب الأول"),
      part(1, 2, "الباب الثاني"),
      part(1, 3, "الباب الثالث"),
      part(1, 4, "الباب الرابع"),
    ],
  },
  {
    id: 2,
    title: "دورة رواد الرهوط",
    parts: [
      part(2, 1, "الباب الأول"),
      part(2, 2, "الباب الثاني"),
      part(2, 3, "الباب الثالث"),
      part(2, 4, "الباب الرابع"),
      part(2, 5, "الباب الخامس"),
      part(2, 6, "الباب السادس"),
    ],
  },
  {
    id: 3,
    title: "دورة القادة المعلمين",
    parts: [
      part(3, 1, "الباب الأول"),
      part(3, 2, "الباب الثاني"),
      part(3, 3, "الباب الثالث"),
      part(3, 4, "الباب الرابع"),
      part(3, 5, "الباب الخامس"),
    ],
  },
  {
    id: 4,
    title: "دورة تدريب مساعدي القادة",
    parts: [
      part(4, 1, "الباب الأول"),
      part(4, 2, "الباب الثاني"),
      part(4, 3, "الباب الثالث"),
      part(4, 4, "الباب الرابع"),
      part(4, 5, "الباب الخامس"),
    ],
  },
  {
    id: 5,
    title: "دورة تدريب قادة الفرق",
    parts: [
      part(5, 1, "الباب الأول"),
      part(5, 2, "الباب الثاني"),
      part(5, 3, "الباب الثالث"),
      part(5, 4, "الباب الرابع"),
    ],
  },
  {
    id: 6,
    title: "دورة تدريب معدي البرامج",
    parts: [
      part(6, 1, "الباب الأول"),
      part(6, 2, "الباب الثاني"),
      part(6, 3, "الباب الثالث"),
      part(6, 4, "الباب الرابع"),
      part(6, 5, "الباب الخامس"),
    ],
  },
  {
    id: 7,
    title: "دورة تدريب القادة العموم",
    parts: [
      part(7, 1, "الباب الأول"),
      part(7, 2, "الباب الثاني"),
      part(7, 3, "الباب الثالث"),
      part(7, 4, "الباب الرابع"),
      part(7, 5, "الباب الخامس"),
    ],
  },
  {
    id: 8,
    title: "دورة تدريب قائد المجموعة",
    parts: [
      part(8, 1, "الباب الأول"),
      part(8, 2, "الباب الثاني"),
      part(8, 3, "الباب الثالث"),
      part(8, 4, "الباب الرابع"),
    ],
  },
];
