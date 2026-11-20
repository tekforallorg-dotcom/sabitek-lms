import Link from 'next/link'
import { BookOpen } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { EmptyState, PANEL, Page, PageHeader } from '@/components/ui/page'

export interface InstructorCourse {
  id: string
  title: string
  slug: string
  description: string
  status: string
  lessons?: unknown[]
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const textLink = 'text-sm font-medium text-gray-600 hover:text-red-600 hover:underline underline-offset-4'

/**
 * The instructor's home page: their courses, and the two things they come
 * here to do (answer learners, start a course). Counts sit in one line under
 * the title instead of in a row of tiles.
 */
export default function InstructorHome({
  courses,
  onboarding,
}: {
  courses: InstructorCourse[]
  /** The getting-started checklist. Hides itself once done. */
  onboarding?: React.ReactNode
}) {
  const published = courses.filter((course) => course.status === 'published').length
  const drafts = courses.filter((course) => course.status === 'draft').length
  const lessons = courses.reduce((total, course) => total + (course.lessons?.length || 0), 0)

  const summary =
    courses.length === 0
      ? 'Courses you create appear here.'
      : [`${published} live`, drafts > 0 && plural(drafts, 'draft'), plural(lessons, 'lesson')].filter(Boolean).join(' · ')

  return (
    <Page>
      <PageHeader
        title="My courses"
        description={summary}
        actions={
          <>
            <Link href="/instructor/questions" className={buttonVariants({ variant: 'outline' })}>
              Learner questions
            </Link>
            {courses.length > 0 && (
              <Link href="/instructor/courses/create" className={buttonVariants()}>
                Create course
              </Link>
            )}
          </>
        }
      />

      {onboarding}

      {courses.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No courses yet"
          description="Create a course, add lessons, then publish it when you are ready for learners."
          action={
            <Link href="/instructor/courses/create" className={buttonVariants()}>
              Create your first course
            </Link>
          }
        />
      ) : (
        <ul className={`${PANEL} divide-y divide-gray-200`}>
          {courses.map((course) => {
            const live = course.status === 'published'
            return (
              <li key={course.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/instructor/courses/${course.slug}`}
                    className="text-base font-medium leading-6 text-gray-900 hover:text-red-600"
                  >
                    {course.title}
                  </Link>
                  <p className="mt-1 flex items-center gap-2 text-xs leading-4 text-gray-500">
                    <span
                      className={`h-2 w-2 flex-shrink-0 rounded-full ${live ? 'bg-green-600' : 'bg-amber-500'}`}
                      aria-hidden="true"
                    />
                    <span className={live ? 'text-green-700' : 'text-amber-700'}>{live ? 'Live' : 'Draft'}</span>
                    <span aria-hidden="true">·</span>
                    {plural(course.lessons?.length || 0, 'lesson')}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-4">
                  <Link href={`/courses/${course.slug}`} className={textLink}>
                    Preview
                  </Link>
                  <Link href={`/instructor/courses/${course.slug}/analytics`} className={textLink}>
                    Analytics
                  </Link>
                  <Link
                    href={`/instructor/courses/${course.slug}`}
                    className={buttonVariants({ variant: 'outline', size: 'sm' })}
                  >
                    Edit course
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </Page>
  )
}
