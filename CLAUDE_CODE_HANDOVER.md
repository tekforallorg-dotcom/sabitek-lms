# SABITEK LMS: ADD COURSE MODULES FEATURE
## Handover Document for Claude Code (VSCode)

---

## 🎯 MISSION OBJECTIVE

Transform Sabitek LMS from a flat Course → Lessons structure to a hierarchical Course → Modules → Lessons structure, while maintaining 100% backward compatibility with existing courses.

**Current State:**
```
Course: "AI for Beginners"
  ├─ Lesson 1: Table of Content
  ├─ Lesson 2: Welcome to AI ✓
  ├─ Lesson 3: AI in Our Daily Lives
  └─ Lesson 4: History & Evolution of AI
```

**Target State:**
```
Course: "AI for Beginners"
  ├─ Module 1: Introduction to AI (1/3 completed)
  │   ├─ Lesson 1: Table of Content ✓
  │   ├─ Lesson 2: Welcome to AI ✓
  │   └─ Lesson 3: AI in Our Daily Lives
  └─ Module 2: History & Foundations (0/2 completed)
      ├─ Lesson 4: History & Evolution of AI ← Current
      └─ Lesson 5: Understanding Data
```

---

## 📊 DATABASE CHANGES (ALREADY COMPLETED)

The database migration has been run. Here's what was added:

### New Table: `modules`
```sql
CREATE TABLE modules (
  id UUID PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_course_module_order UNIQUE (course_id, order_index)
);
```

### Modified Table: `lessons`
- **Added Column:** `module_id UUID NULLABLE REFERENCES modules(id) ON DELETE SET NULL`
- **Backward Compatibility:** Existing lessons have `module_id = NULL` (belong directly to course)
- **New Lessons:** Must have a `module_id` (belong to a module)

### Indexes Created
- `idx_modules_course_id` - Fast module lookups by course
- `idx_modules_order` - Fast ordered module retrieval
- `idx_lessons_module_id` - Fast lesson lookups by module
- `idx_lessons_module_order` - Fast ordered lesson retrieval within modules

### RLS Policies
- Public can view modules of published courses
- Instructors can manage modules in their courses
- Instructors can manage lessons in their modules

---

## 🏗️ SYSTEM ARCHITECTURE

### Data Model Relationships
```
courses (existing)
  ├─→ modules (NEW)
  │     ├─→ lessons (with module_id) ← NEW LESSONS
  │     └─→ [calculated] module_progress
  └─→ lessons (module_id = NULL) ← LEGACY LESSONS

lesson_progress (existing)
  └─→ Used to calculate module completion
```

### Detection Logic

**How to detect if a course uses modules:**
```typescript
const courseHasModules = await supabase
  .from('modules')
  .select('id')
  .eq('course_id', courseId)
  .limit(1)
  .single();

if (courseHasModules.data) {
  // Show expandable module UI
} else {
  // Show flat lesson list (legacy behavior)
}
```

---

## 📁 FILES TO CREATE/MODIFY

### Priority 1: Type Definitions (DO THIS FIRST)

#### 1. Update `types/supabase.ts`
**Action:** Regenerate from Supabase (already done via CLI)
**Verify:** Check that `Database['public']['Tables']` includes `modules`

#### 2. Create `types/module.ts`
**Purpose:** TypeScript interfaces for module data
**Location:** `/types/module.ts`
```typescript
export interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface ModuleWithLessons extends Module {
  lessons: Lesson[];
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

export interface ModuleProgress {
  module_id: string;
  total_lessons: number;
  completed_lessons: number;
  is_completed: boolean;
  completion_percentage: number;
}
```

---

### Priority 2: Database Utilities

#### 3. Create `lib/db/modules.ts`
**Purpose:** Module CRUD operations
**Location:** `/lib/db/modules.ts`
```typescript
import { createClient } from '@/lib/supabase/server';
import type { Module, ModuleWithLessons } from '@/types/module';

/**
 * Get all modules for a course with their lessons
 */
export async function getCourseModules(
  courseId: string,
  userId?: string
): Promise<ModuleWithLessons[]> {
  const supabase = await createClient();
  
  // Get modules with lessons
  const { data: modules, error } = await supabase
    .from('modules')
    .select(`
      *,
      lessons (
        id,
        title,
        slug,
        lesson_order,
        content_type,
        duration_minutes,
        video_duration_seconds
      )
    `)
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (error) throw error;
  if (!modules) return [];

  // Get user progress if userId provided
  let progressMap: Record<string, boolean> = {};
  if (userId) {
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed_at')
      .eq('course_id', courseId)
      .eq('user_id', userId)
      .not('completed_at', 'is', null);

    if (progress) {
      progressMap = progress.reduce((acc, p) => {
        acc[p.lesson_id] = true;
        return acc;
      }, {} as Record<string, boolean>);
    }
  }

  // Calculate module completion
  return modules.map(module => {
    const lessons = module.lessons || [];
    const completedCount = lessons.filter(
      lesson => progressMap[lesson.id]
    ).length;

    return {
      ...module,
      lessons: lessons.sort((a, b) => a.lesson_order - b.lesson_order),
      total_lessons: lessons.length,
      completed_lessons: completedCount,
      completion_percentage: lessons.length > 0 
        ? Math.round((completedCount / lessons.length) * 100)
        : 0
    };
  });
}

/**
 * Create a new module
 */
export async function createModule(data: {
  course_id: string;
  title: string;
  description?: string;
  order_index: number;
}): Promise<Module> {
  const supabase = await createClient();
  
  const { data: module, error } = await supabase
    .from('modules')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return module;
}

/**
 * Update module
 */
export async function updateModule(
  moduleId: string,
  updates: Partial<Pick<Module, 'title' | 'description' | 'order_index'>>
): Promise<Module> {
  const supabase = await createClient();
  
  const { data: module, error } = await supabase
    .from('modules')
    .update(updates)
    .eq('id', moduleId)
    .select()
    .single();

  if (error) throw error;
  return module;
}

/**
 * Delete module (lessons will have module_id set to NULL due to ON DELETE SET NULL)
 */
export async function deleteModule(moduleId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('modules')
    .delete()
    .eq('id', moduleId);

  if (error) throw error;
}

/**
 * Reorder modules for a course
 */
export async function reorderModules(
  courseId: string,
  moduleOrders: { id: string; order_index: number }[]
): Promise<void> {
  const supabase = await createClient();
  
  // Update each module's order_index
  const updates = moduleOrders.map(({ id, order_index }) =>
    supabase
      .from('modules')
      .update({ order_index })
      .eq('id', id)
      .eq('course_id', courseId)
  );

  await Promise.all(updates);
}
```

#### 4. Update `lib/db/lessons.ts` (if exists, or create it)
**Purpose:** Add module_id handling to lesson operations

**Key Changes:**
- Add `module_id` parameter to `createLesson()` function
- Update lesson queries to optionally filter by `module_id`
- Ensure lesson ordering is scoped within module

---

### Priority 3: API Routes

#### 5. Create `app/api/courses/[courseId]/modules/route.ts`
**Purpose:** CRUD operations for modules
**HTTP Methods:** GET, POST
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCourseModules, createModule } from '@/lib/db/modules';

export async function GET(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const modules = await getCourseModules(
      params.courseId,
      user?.id
    );

    return NextResponse.json({ modules });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Failed to fetch modules' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the course
    const { data: course } = await supabase
      .from('courses')
      .select('instructor_id')
      .eq('id', params.courseId)
      .single();

    if (!course || course.instructor_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, order_index } = body;

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const module = await createModule({
      course_id: params.courseId,
      title,
      description,
      order_index: order_index || 1
    });

    return NextResponse.json({ module }, { status: 201 });
  } catch (error) {
    console.error('Error creating module:', error);
    return NextResponse.json(
      { error: 'Failed to create module' },
      { status: 500 }
    );
  }
}
```

#### 6. Create `app/api/modules/[moduleId]/route.ts`
**Purpose:** Update and delete individual modules
**HTTP Methods:** PATCH, DELETE

#### 7. Create `app/api/modules/[moduleId]/lessons/route.ts`
**Purpose:** Get/create lessons within a module
**HTTP Methods:** GET, POST

---

### Priority 4: UI Components

#### 8. Create `components/courses/ModuleAccordion.tsx`
**Purpose:** Expandable module display with lessons
**Features:**
- Click to expand/collapse
- Show completion progress
- Display lessons in order
- Current lesson highlight
```typescript
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronRight, CheckCircle, Circle } from 'lucide-react';
import type { ModuleWithLessons } from '@/types/module';

interface ModuleAccordionProps {
  modules: ModuleWithLessons[];
  courseId: string;
  currentLessonId?: string;
}

export default function ModuleAccordion({
  modules,
  courseId,
  currentLessonId
}: ModuleAccordionProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id)) // Expand all by default
  );

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Course Modules</h2>
        <p className="text-sm text-gray-500">
          {modules.reduce((sum, m) => sum + m.completed_lessons, 0)} /{' '}
          {modules.reduce((sum, m) => sum + m.total_lessons, 0)} completed
        </p>
      </div>

      {modules.map((module, idx) => (
        <div
          key={module.id}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Module Header */}
          <button
            onClick={() => toggleModule(module.id)}
            className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              {expandedModules.has(module.id) ? (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronRight className="w-5 h-5 text-gray-500" />
              )}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Module {idx + 1}:</span>
                  <span className="text-gray-700">{module.title}</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {module.completed_lessons}/{module.total_lessons} lessons completed
                  {module.completion_percentage === 100 && (
                    <span className="ml-2 text-green-600">✓ Complete</span>
                  )}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="ml-auto mr-4">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-600 transition-all"
                  style={{ width: `${module.completion_percentage}%` }}
                />
              </div>
            </div>
          </button>

          {/* Lessons List */}
          {expandedModules.has(module.id) && (
            <div className="divide-y divide-gray-100">
              {module.lessons.map((lesson, lessonIdx) => {
                const isCompleted = lesson.id in (module as any).progressMap;
                const isCurrent = lesson.id === currentLessonId;

                return (
                  <Link
                    key={lesson.id}
                    href={`/courses/${courseId}/lessons/${lesson.slug}`}
                    className={`
                      flex items-center gap-4 p-4 hover:bg-gray-50 transition
                      ${isCurrent ? 'bg-red-50 border-l-4 border-red-600' : ''}
                    `}
                  >
                    {/* Lesson Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium">
                      {lessonIdx + 1}
                    </div>

                    {/* Lesson Content */}
                    <div className="flex-1">
                      <h4 className={`font-medium ${isCurrent ? 'text-red-600' : ''}`}>
                        {lesson.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
                        <span className="capitalize">{lesson.content_type}</span>
                        {lesson.duration_minutes && (
                          <>
                            <span>•</span>
                            <span>{lesson.duration_minutes}m</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Completion Status */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <Circle className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

#### 9. Update `app/courses/[courseId]/page.tsx`
**Purpose:** Detect and show modules OR legacy flat lesson list

**Key Logic:**
```typescript
// In the component
const { data: modulesData } = await supabase
  .from('modules')
  .select('id')
  .eq('course_id', courseId)
  .limit(1);

const hasModules = modulesData && modulesData.length > 0;

if (hasModules) {
  const modules = await getCourseModules(courseId, user?.id);
  return <ModuleAccordion modules={modules} courseId={courseId} />;
} else {
  // Show legacy flat lesson list
  return <LessonList courseId={courseId} />;
}
```

---

### Priority 5: Instructor Dashboard

#### 10. Create `app/instructor/courses/[courseId]/modules/page.tsx`
**Purpose:** Module management interface for instructors
**Features:**
- List all modules
- Create new module
- Edit module title/description
- Reorder modules (drag & drop)
- Delete module (with confirmation)

#### 11. Update `app/instructor/courses/[courseId]/lessons/new/page.tsx`
**Purpose:** Add module selector when creating lessons

**Key Addition:**
```typescript
// Add module selection dropdown
<select name="module_id" required>
  <option value="">Select a module...</option>
  {modules.map(module => (
    <option key={module.id} value={module.id}>
      Module {module.order_index}: {module.title}
    </option>
  ))}
</select>
```

---

## 🧪 TESTING CHECKLIST

### Unit Tests (Create if time permits)
- [ ] `getCourseModules()` returns correct data
- [ ] Module completion calculation is accurate
- [ ] Lesson ordering within modules works

### Integration Tests (Manual Testing Required)

#### Test Case 1: Legacy Course (No Modules)
- [ ] Open existing course "AI for Beginners"
- [ ] Verify lessons display in flat list (NOT in modules)
- [ ] Verify lesson navigation works
- [ ] Verify progress tracking works

#### Test Case 2: New Course with Modules
- [ ] Create new course
- [ ] Create Module 1: "Introduction"
- [ ] Create Module 2: "Advanced Topics"
- [ ] Add 2 lessons to Module 1
- [ ] Add 3 lessons to Module 2
- [ ] Verify modules display as expandable sections
- [ ] Verify lesson count shows "0/5 completed"

#### Test Case 3: Module Expansion/Collapse
- [ ] Click module header to collapse
- [ ] Verify lessons hide
- [ ] Click again to expand
- [ ] Verify lessons reappear

#### Test Case 4: Progress Tracking
- [ ] Complete 1 lesson in Module 1
- [ ] Verify module shows "1/2 completed"
- [ ] Complete 2nd lesson
- [ ] Verify module shows "2/2 completed ✓ Complete"

#### Test Case 5: Current Lesson Highlight
- [ ] Navigate to Lesson 3
- [ ] Verify Lesson 3 has red background
- [ ] Verify red left border on lesson row

#### Test Case 6: Instructor Module Management
- [ ] Go to instructor dashboard
- [ ] Create a new module
- [ ] Reorder modules
- [ ] Edit module title
- [ ] Delete module (verify lessons become orphaned)

---

## 🚨 CRITICAL REQUIREMENTS

### 1. Backward Compatibility (NON-NEGOTIABLE)
- **RULE:** All existing courses without modules MUST continue working exactly as before
- **TEST:** Load "AI for Beginners" course - should show flat lesson list, NOT modules
- **IMPLEMENTATION:** Always check `if (course.has_modules)` before rendering module UI

### 2. Data Integrity
- **RULE:** Never delete lessons when deleting modules
- **DATABASE:** `ON DELETE SET NULL` ensures lessons survive module deletion
- **WARNING:** Orphaned lessons (module_id = NULL) should be flagged in instructor UI

### 3. Performance
- **RULE:** Minimize database queries
- **IMPLEMENTATION:** Use `select('*, lessons(*)')` to get modules + lessons in 1 query
- **AVOID:** N+1 queries (don't fetch lessons separately for each module)

### 4. User Experience
- **RULE:** Current lesson must be visually obvious
- **IMPLEMENTATION:** Red background + left border for active lesson
- **PROGRESS:** Always show "X/Y completed" for each module

### 5. Error Handling
- **RULE:** Gracefully handle missing modules
- **SCENARIO:** If modules query fails, fall back to flat lesson list
- **LOGGING:** Log errors to console but don't crash the page

---

## 📋 IMPLEMENTATION SEQUENCE

Follow this exact order to avoid breaking changes:

1. **Verify Database Migration** (Already done)
   - Run verification query
   - Confirm types regenerated

2. **Create Type Definitions**
   - `/types/module.ts`
   - Update imports in existing files

3. **Create Database Utilities**
   - `/lib/db/modules.ts`
   - Test with simple queries

4. **Create API Routes**
   - `/app/api/courses/[courseId]/modules/route.ts`
   - Test with Postman/Thunder Client

5. **Build UI Components**
   - `ModuleAccordion.tsx`
   - Test with mock data first

6. **Update Course Detail Page**
   - Add module detection logic
   - Render ModuleAccordion OR LessonList

7. **Build Instructor Dashboard**
   - Module management interface
   - Lesson creation with module selection

8. **Test Everything**
   - Run all test cases above
   - Fix bugs iteratively

---

## 🔄 ROLLBACK PLAN

If something goes wrong:

### Database Rollback
```sql
-- Remove module_id from lessons
ALTER TABLE lessons DROP COLUMN module_id;

-- Drop modules table
DROP TABLE modules CASCADE;

-- Remove indexes
DROP INDEX IF EXISTS idx_modules_course_id;
DROP INDEX IF EXISTS idx_modules_order;
DROP INDEX IF EXISTS idx_lessons_module_id;
```

### Code Rollback
```bash
git checkout HEAD~1  # Revert to previous commit
npm run dev          # Verify old code works
```

---

## 📚 CONTEXT FROM PREVIOUS WORK

### Sabitek LMS Background
- **Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, Supabase
- **Target Users:** African learners, underserved communities
- **Features Built:** 
  - Course management
  - Lesson player (text, video, PDF, PowerPoint)
  - SabiQuiz (AI quiz generation)
  - SabiAdvisor (career guidance chatbot)
  - Certificate generation
  - Progress tracking

### Current Status (from "fix: Working auth" commit)
- Authentication working with Gemini caching
- SMTP integration via Resend
- Role-based dashboards (learner, instructor, admin)
- Real-time progress tracking

### Known Issues (DON'T TOUCH)
- Password reset flow recently fixed
- Email confirmation working
- Don't modify auth-related files unless absolutely necessary

---

## ✅ QUALITY GATE CHECKLIST

Before marking complete, verify:

- [ ] All TypeScript types are correct (no `any`)
- [ ] Database queries use proper indexes
- [ ] RLS policies tested (try accessing as different users)
- [ ] UI renders correctly on mobile and desktop
- [ ] Module expansion/collapse is smooth (no flicker)
- [ ] Progress percentages calculate correctly
- [ ] Legacy courses still work (NO MODULES VISIBLE)
- [ ] New courses show modules properly
- [ ] Instructor can create modules and lessons
- [ ] Deleting module doesn't delete lessons
- [ ] Console has no errors
- [ ] Network tab shows minimal queries (not N+1)

---

## 🎯 ACCEPTANCE CRITERIA

### User Story: Learner Views Course with Modules
**Given** a course has modules  
**When** learner opens the course  
**Then** they see expandable module sections with completion progress  
**And** can click to expand/collapse modules  
**And** can see which lessons are completed (green checkmark)  
**And** current lesson is highlighted in red

### User Story: Instructor Creates Module
**Given** instructor owns a course  
**When** they navigate to module management  
**Then** they can create a new module with title and description  
**And** module appears in the list with order_index  
**And** they can add lessons to the module

### User Story: Legacy Course Compatibility
**Given** a course created before the module feature  
**When** learner opens the course  
**Then** they see a flat lesson list (NOT modules)  
**And** all functionality works as before

---

## 🚀 FINAL NOTES

- **Be Methodical:** Follow the implementation sequence exactly
- **Test Continuously:** After each file, verify it works before moving on
- **Ask Questions:** If anything is unclear, ask before proceeding
- **Document Decisions:** Add comments explaining non-obvious logic
- **Safety First:** Don't break existing courses - backward compatibility is critical

**Good luck! You've got this. 🎉**

---

**Last Updated:** 2025-11-16  
**Migration Status:** Database ready ✅  
**Next Step:** Create `/types/module.ts`

