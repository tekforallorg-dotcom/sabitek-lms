'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, CheckCircle, Lock, Users } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Collapsible, EmptyState, PANEL, Page, PageHeader, ProgressBar, Section } from '@/components/ui/page'

export interface EnrolledCourse {
  id: string
  course_id: string
  progress_percentage: number
  course: {
    id: string
    title: string
    description: string
    instructor_id: string
    slug: string
    cover_image_url?: string
    instructor?: {
      full_name: string
    }
  }
}

export interface Certificate {
  id: string
  certificate_number: string
  grade_percentage: number
  issued_at: string
  course: {
    title: string
    cover_image_url?: string
  }
}

export interface CohortSummary {
  cohort_id: string
  cohort_name: string
  program?: { name?: string } | null
  sponsorship?: string
  progress: number
  completed_courses: number
  total_courses: number
  courses: Array<{
    id: string
    slug: string
    title: string
    locked?: boolean
    completed?: boolean
    progress?: number
  }>
}

/** How many courses the grid shows before "Show all". Two rows on a laptop. */
const FIRST_COURSES = 8

/** How many of a program's courses are listed before "and N more". */
const PROGRAM_COURSES = 6

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

const textLink = 'text-sm font-medium text-red-600 hover:text-red-700 hover:underline underline-offset-4'

function CourseCard({ enrollment }: { enrollment: EnrolledCourse }) {
  const progress = enrollment.progress_percentage || 0
  const status = progress === 100 ? 'Completed' : progress > 0 ? `${progress}% done` : 'Not started'

  return (
    <Link
      href={`/courses/${enrollment.course.slug}`}
      // A compact row on phones, a card with a cover from tablets up.
      className={`${PANEL} group flex h-full overflow-hidden transition-colors hover:border-gray-300 sm:flex-col`}
    >
      <div className="relative w-24 flex-shrink-0 bg-gray-100 sm:h-28 sm:w-full">
        {enrollment.course.cover_image_url ? (
          <Image
            src={enrollment.course.cover_image_url}
            alt=""
            fill
            sizes="(max-width: 640px) 96px, (max-width: 1280px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <BookOpen className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 text-gray-300" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <h3 className="text-sm font-medium leading-5 text-gray-900 line-clamp-2 group-hover:text-red-600">
          {enrollment.course.title}
        </h3>
        {enrollment.course.instructor?.full_name && (
          <p className="mt-1 text-xs leading-4 text-gray-500">{enrollment.course.instructor.full_name}</p>
        )}
        <div className="mt-auto pt-3 sm:pt-4">
          <ProgressBar value={progress} label={`${enrollment.course.title} progress`} />
          <p
            className={`mt-2 flex items-center gap-1 text-xs leading-4 ${
              progress === 100 ? 'text-green-700' : 'text-gray-500'
            }`}
          >
            {progress === 100 && <CheckCircle className="h-3 w-3" aria-hidden="true" />}
            {status}
          </p>
        </div>
      </div>
    </Link>
  )
}

function ProgramCard({ item }: { item: CohortSummary }) {
  return (
    <div className={`${PANEL} p-4 sm:p-6`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-base font-medium leading-6 text-gray-900">{item.program?.name || 'Program'}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs leading-4 text-gray-500">
            <Users className="h-3 w-3" aria-hidden="true" />
            {item.cohort_name}
            {item.sponsorship === 'institution_sponsored' && <span> · Sponsored access</span>}
          </p>
        </div>
        <p className="flex-shrink-0 text-xs tabular-nums leading-4 text-gray-500">
          {item.completed_courses} of {plural(item.total_courses, 'course')}
        </p>
      </div>

      <div className="mt-4">
        <ProgressBar value={item.progress} label={`${item.program?.name || 'Program'} progress`} />
      </div>

      {item.courses.length > 0 && (
        <ol className="mt-4 divide-y divide-gray-100 border-t border-gray-100">
          {item.courses.slice(0, PROGRAM_COURSES).map((course) => {
            const done = course.completed || course.progress === 100
            const row = 'flex items-center gap-3 py-2 text-sm leading-5'
            if (course.locked) {
              return (
                <li
                  key={course.id}
                  className={`${row} text-gray-400`}
                  title="Unlocks after the previous course in your program"
                >
                  <Lock className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                  <span className="truncate">{course.title}</span>
                  <span className="ml-auto flex-shrink-0 text-xs">Locked</span>
                </li>
              )
            }
            return (
              <li key={course.id}>
                <Link href={`/courses/${course.slug}`} className={`${row} text-gray-700 hover:text-red-600`}>
                  {done ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" aria-hidden="true" />
                  ) : (
                    <BookOpen className="h-4 w-4 flex-shrink-0 text-gray-400" aria-hidden="true" />
                  )}
                  <span className="truncate">{course.title}</span>
                  <span className="ml-auto flex-shrink-0 text-xs tabular-nums text-gray-500">
                    {done ? 'Completed' : course.progress ? `${course.progress}%` : 'Not started'}
                  </span>
                </Link>
              </li>
            )
          })}
          {item.courses.length > PROGRAM_COURSES && (
            <li className="py-2 text-xs leading-4 text-gray-500">
              and {plural(item.courses.length - PROGRAM_COURSES, 'more course')}
            </li>
          )}
        </ol>
      )}
    </div>
  )
}

/**
 * The learner's home page, in the order a returning learner needs it: the
 * next lesson, their courses, their programs, then everything else.
 *
 * It only arranges what it is given. app/dashboard/page.tsx loads the data
 * and passes the self-loading cards in through the three slots.
 */
export default function LearnerHome({
  firstName,
  enrolledCourses,
  certificates,
  cohorts,
  resume,
  onboarding,
  achievements,
}: {
  firstName?: string
  enrolledCourses: EnrolledCourse[]
  certificates: Certificate[]
  cohorts: CohortSummary[]
  /** The "up next" card, or nothing when there is no lesson to resume. */
  resume?: React.ReactNode
  /** The getting-started checklist. Hides itself once done. */
  onboarding?: React.ReactNode
  /** Streak, points and leaderboard. Shown collapsed. */
  achievements?: React.ReactNode
}) {
  const [showAll, setShowAll] = useState(false)

  const inProgress = enrolledCourses.filter((c) => c.progress_percentage > 0 && c.progress_percentage < 100)
  const notStarted = enrolledCourses.filter((c) => !c.progress_percentage)
  const completed = enrolledCourses.filter((c) => c.progress_percentage === 100)
  // Unfinished work first; finished courses last.
  const ordered = [...inProgress, ...notStarted, ...completed]
  const visible = showAll ? ordered : ordered.slice(0, FIRST_COURSES)

  const summary =
    enrolledCourses.length === 0
      ? 'Pick a course to get started.'
      : [
          inProgress.length > 0 && `${inProgress.length} in progress`,
          notStarted.length > 0 && `${notStarted.length} not started`,
          completed.length > 0 && `${completed.length} completed`,
          certificates.length > 0 && plural(certificates.length, 'certificate'),
        ]
          .filter(Boolean)
          .join(' · ')

  return (
    <Page>
      <PageHeader
        title={firstName ? `${firstName}’s learning` : 'Your learning'}
        description={summary}
        actions={
          <Link href="/courses" className={buttonVariants({ variant: 'outline' })}>
            Browse courses
          </Link>
        }
      />

      {resume}

      <Section title="My courses">
        {enrolledCourses.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            description="Enrol in a course and it will show up here, with your progress."
            action={
              <Link href="/courses" className={buttonVariants()}>
                Find a course
              </Link>
            }
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {visible.map((enrollment) => (
                <CourseCard key={enrollment.id} enrollment={enrollment} />
              ))}
            </div>
            {ordered.length > FIRST_COURSES && (
              <div className="mt-4 flex justify-center">
                <Button variant="outline" onClick={() => setShowAll((value) => !value)}>
                  {showAll ? 'Show fewer' : `Show all ${ordered.length} courses`}
                </Button>
              </div>
            )}
          </>
        )}
      </Section>

      {cohorts.length > 0 && (
        <Section
          title="My programs"
          action={
            <Link href="/cohorts/join" className={textLink}>
              Join with a code
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {cohorts.map((item) => (
              <ProgramCard key={item.cohort_id} item={item} />
            ))}
          </div>
        </Section>
      )}

      {onboarding}

      {certificates.length > 0 && (
        <Section
          title="Certificates"
          action={
            <Link href="/certificates" className={textLink}>
              All certificates
            </Link>
          }
        >
          <ul className={`${PANEL} divide-y divide-gray-200`}>
            {certificates.map((cert) => (
              <li key={cert.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-5 text-gray-900">{cert.course.title}</p>
                  <p className="text-xs tabular-nums leading-4 text-gray-500">
                    Issued {new Date(cert.issued_at).toLocaleDateString()} · Grade {cert.grade_percentage}%
                  </p>
                </div>
                <Link href={`/certificates/${cert.id}`} className={textLink}>
                  View
                </Link>
                <Link href={`/certificates/${cert.id}?download=true`} className={textLink}>
                  Download
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {achievements && <Collapsible title="Streak, points and leaderboard">{achievements}</Collapsible>}
    </Page>
  )
}
