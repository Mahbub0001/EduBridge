/* eslint-disable @typescript-eslint/no-explicit-any */
import api, { unwrap } from './api';

export interface Quiz {
  id: string;
  title: string;
  course_id: string;
  module_id?: string;
  instructions?: string;
  passing_score?: number;
  total_marks?: number;
  time_limit?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_correct_answers?: boolean;
  available_from?: string;
  available_until?: string;
  status?: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  type: 'mcq' | 'true_false' | 'short_answer';
  question_text: string;
  options?: string[];
  correct_answer: string;
  marks?: number;
  explanation?: string;
  order: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  correct_count: number;
  total_questions: number;
  submitted_at: string;
}

/* ── STUDENT APIs ── */
export async function getQuiz(courseId: string, quizId: string): Promise<Quiz> {
  const res = await api.get(`/courses/${courseId}/quizzes/${quizId}`);
  return unwrap<Quiz>(res);
}

export async function getQuizQuestions(quizId: string): Promise<Question[]> {
  const res = await api.get(`/quizzes/${quizId}/questions`);
  return unwrap<Question[]>(res);
}

export async function getMyAttempts(quizId: string): Promise<QuizAttempt[]> {
  const res = await api.get(`/quizzes/${quizId}/attempts`);
  return unwrap<QuizAttempt[]>(res);
}

export async function submitQuiz(quizId: string, answers: Record<string, string>): Promise<QuizAttempt> {
  const res = await api.post(`/quizzes/${quizId}/submit`, { answers });
  return unwrap<QuizAttempt>(res);
}


/* ── PREMIUM INSTRUCTOR ASSESSMENT APIs ── */
export async function getCourseQuizzes(courseId: string): Promise<any[]> {
  const res = await api.get(`/instructor/courses/${courseId}/quizzes`);
  return unwrap<any[]>(res);
}

export async function createQuiz(courseId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/courses/${courseId}/quizzes`, data);
  return unwrap<any>(res);
}

export async function updateQuiz(quizId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/quizzes/${quizId}`, data);
  return unwrap<any>(res);
}

export async function deleteQuiz(quizId: string): Promise<void> {
  await api.delete(`/instructor/quizzes/${quizId}`);
}

export async function createQuestion(quizId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.post(`/instructor/quizzes/${quizId}/questions`, data);
  return unwrap<any>(res);
}

export async function updateQuestion(questionId: string, data: Record<string, unknown>): Promise<any> {
  const res = await api.patch(`/instructor/questions/${questionId}`, data);
  return unwrap<any>(res);
}

export async function deleteQuestion(questionId: string): Promise<void> {
  await api.delete(`/instructor/questions/${questionId}`);
}

export async function publishQuiz(quizId: string, status: string): Promise<void> {
  await api.patch(`/instructor/quizzes/${quizId}/publish`, { status });
}

export async function previewQuiz(quizId: string): Promise<any> {
  const res = await api.get(`/instructor/quizzes/${quizId}/preview`);
  return unwrap<any>(res);
}
