import { Suspense } from 'react';
import { StudentPage } from '@/components/student/StudentPage';

/** Another student's profile. The id is only known in the browser, hence the Suspense. */
export default function Page() {
  return (
    <Suspense fallback={null}>
      <StudentPage />
    </Suspense>
  );
}
