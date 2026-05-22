import api, { unwrap } from './api';

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  course_title: string;
  issued_at: string;
  certificate_url: string;
  user_name?: string;
}

export async function getMyCertificates(): Promise<Certificate[]> {
  const res = await api.get('/certificates/');
  return unwrap<Certificate[]>(res);
}

export async function generateCertificate(courseId: string): Promise<Certificate> {
  const res = await api.post('/certificates/generate', { course_id: courseId });
  return unwrap<Certificate>(res);
}

export async function verifyCertificate(certificateId: string): Promise<Certificate> {
  const res = await api.get(`/certificates/verify/${certificateId}`);
  return unwrap<Certificate>(res);
}
