"use client";

import Link from "next/link";
import Image from "next/image";

interface Course {
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  modules: string;
  rating: string;
  reviews: string;
  image: string;
  categoryColor: string;
}

export function FeaturedCourses() {
  const courses: Course[] = [
    {
      title: "Complete AI Development Bootcamp",
      description:
        "Learn machine learning, deep learning, and neural networks to build intelligent AI applications from scratch",
      category: "AI Development",
      level: "Beginner",
      duration: "24 hours",
      modules: "156 modules",
      rating: "4.8",
      reviews: "2.3k",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/367a18e619-5e3bf6dfa3d7ce5244bc.png",
      categoryColor: "var(--accent)",
    },
    {
      title: "Machine Learning Masterclass",
      description:
        "Master supervised and unsupervised learning algorithms using Python, TensorFlow, and scikit-learn",
      category: "Machine Learning",
      level: "Intermediate",
      duration: "18 hours",
      modules: "89 modules",
      rating: "4.9",
      reviews: "1.8k",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/7004f33f8b-7e66eef8e011cc4ede93.png",
      categoryColor: "var(--accent)",
    },
    {
      title: "Deep Learning with Python",
      description:
        "Build neural networks, CNNs, and RNNs using Python, Keras, and TensorFlow for real-world applications",
      category: "Deep Learning",
      level: "Advanced",
      duration: "32 hours",
      modules: "201 modules",
      rating: "4.7",
      reviews: "3.1k",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/838cb4b89a-b07018eaea0524d5bda3.png",
      categoryColor: "var(--accent)",
    },
    {
      title: "Natural Language Processing",
      description:
        "Build NLP applications with text analysis, sentiment analysis, and language models using modern frameworks",
      category: "NLP",
      level: "Intermediate",
      duration: "28 hours",
      modules: "134 modules",
      rating: "4.6",
      reviews: "1.5k",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/06d6f18f59-65aff4fa71ddad952db8.png",
      categoryColor: "var(--accent)",
    },
    {
      title: "Computer Vision Fundamentals",
      description:
        "Learn image processing, object detection, and facial recognition using OpenCV and deep learning techniques",
      category: "Computer Vision",
      level: "Beginner",
      duration: "16 hours",
      modules: "78 modules",
      rating: "4.8",
      reviews: "2.7k",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/188bad8aa7-ba889da9659ba63bf309.png",
      categoryColor: "var(--accent)",
    },
    {
      title: "AI Ethics & Responsible AI",
      description:
        "Understand ethical implications, bias detection, and responsible deployment of AI systems in society",
      category: "AI Ethics",
      level: "Advanced",
      duration: "36 hours",
      modules: "187 modules",
      rating: "4.9",
      reviews: "987",
      image:
        "https://storage.googleapis.com/uxpilot-auth.appspot.com/307632d94a-e8fe6585fdecdaa297f4.png",
      categoryColor: "var(--accent)",
    },
  ];

  return (
    <section id="trending-courses" className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={{ color: "var(--secondary)" }}
            >
              Trending now
            </h2>
            <p className="text-xl" style={{ color: "var(--muted-foreground)" }}>
              Most popular AI courses this month
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden md:flex items-center font-semibold transition-colors hover:opacity-80"
            style={{ color: "var(--primary)" }}
          >
            View all courses
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course, index) => (
            <div
              key={index}
              className="rounded-2xl transition-all duration-300 group overflow-hidden"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              }}
            >
              <div className="relative">
                <Image
                  className="w-full h-48 object-cover"
                  src={course.image}
                  alt={course.title}
                  width={400}
                  height={192}
                />
                <div className="absolute top-4 left-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: course.categoryColor,
                      color: "var(--accent-foreground)",
                    }}
                  >
                    {course.category}
                  </span>
                </div>
                <div className="absolute top-4 right-4">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    {course.level}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3
                  className="text-xl font-semibold mb-2 group-hover:opacity-80 transition-all"
                  style={{ color: "var(--secondary)" }}
                >
                  {course.title}
                </h3>
                <p
                  className="mb-4 leading-relaxed"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  {course.description}
                </p>
                <div
                  className="flex items-center text-sm mb-4 space-x-4"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  <div className="flex items-center">
                    <i className="fa-regular fa-clock mr-1"></i>
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center">
                    <i className="fa-solid fa-play mr-1"></i>
                    <span>{course.modules}</span>
                  </div>
                  <div className="flex items-center">
                    <i
                      className="fa-solid fa-star mr-1"
                      style={{ color: "var(--accent)" }}
                    ></i>
                    <span>
                      {course.rating} ({course.reviews})
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        backgroundColor: "var(--primary)",
                        color: "var(--primary-foreground)",
                        opacity: 0.1,
                      }}
                    >
                      Public
                    </span>
                  </div>
                  <button
                    className="px-6 py-2 rounded-lg font-medium transition-all hover:opacity-90"
                    style={{
                      backgroundColor: "var(--primary)",
                      color: "var(--primary-foreground)",
                    }}
                  >
                    View Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-12 md:hidden">
          <Link
            href="/catalog"
            className="inline-flex items-center px-8 py-3 rounded-lg font-semibold transition-all duration-200"
            style={{
              backgroundColor: "var(--primary)",
              color: "var(--primary-foreground)",
              boxShadow: "var(--shadow-lg)",
            }}
          >
            View all courses
            <i className="fa-solid fa-arrow-right ml-2"></i>
          </Link>
        </div>
      </div>
    </section>
  );
}
