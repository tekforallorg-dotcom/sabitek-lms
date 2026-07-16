'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import FileUploader from '@/components/upload/file-uploader'
import SabiLoader from '@/components/ui/SabiLoader'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Camera,
  Edit3,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  Shield,
  Lock,
  Eye,
  EyeOff,
  KeyRound
} from 'lucide-react'

export default function ProfilePage() {
  const router = useRouter()
  const { user, userProfile, loading } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [profileData, setProfileData] = useState({
    full_name: '',
    bio: '',
    avatar_url: '',
    phone: '',
    location: '',
    website: '',
  })

  // Instructor stats
  const [instructorStats, setInstructorStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
  })

  // Change Password State
  const [showPasswordSection, setShowPasswordSection] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }

    if (userProfile) {
      setProfileData({
        full_name: userProfile.full_name || '',
        bio: userProfile.bio || '',
        avatar_url: userProfile.avatar_url || '',
        phone: userProfile.phone || '',
        location: userProfile.location || '',
        website: userProfile.website || '',
      })

      // Fetch instructor stats if user is an instructor
      if (userProfile.role === 'instructor') {
        fetchInstructorStats()
      }
    }
  }, [user, userProfile, loading, router])

  const fetchInstructorStats = async () => {
    if (!user) return

    try {
      // First, fetch instructor's courses
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, price, is_free')
        .eq('instructor_id', user.id)

      if (coursesError) {
        console.error('Error fetching courses:', coursesError)
        return
      }

      if (courses && courses.length > 0) {
        const totalCourses = courses.length
        const courseIds = courses.map(c => c.id)

        // Fetch enrollments for these courses
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('id, course_id')
          .in('course_id', courseIds)

        if (enrollmentsError) {
          console.error('Error fetching enrollments:', enrollmentsError)
          return
        }

        const totalStudents = enrollments?.length || 0

        // Calculate revenue from paid course enrollments
        let totalRevenue = 0
        if (enrollments) {
          enrollments.forEach(enrollment => {
            const course = courses.find(c => c.id === enrollment.course_id)
            if (course && !course.is_free && course.price) {
              totalRevenue += course.price
            }
          })
        }

        setInstructorStats({
          totalCourses,
          totalStudents,
          totalRevenue,
        })
      } else {
        setInstructorStats({
          totalCourses: 0,
          totalStudents: 0,
          totalRevenue: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching instructor stats:', error)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const { error: updateError } = await supabase
        .from('users')
        .update({
          full_name: profileData.full_name,
          bio: profileData.bio,
          avatar_url: profileData.avatar_url,
          phone: profileData.phone,
          location: profileData.location,
          website: profileData.website,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (updateError) {
        setError(updateError.message)
        setIsSaving(false)
        return
      }

      setSuccess(true)
      setIsEditing(false)
      
      // Refresh the page to update the header
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } catch (err: any) {
      setError(err.message || 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    // Validation
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setPasswordLoading(true)

    try {
      // First, verify current password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userProfile?.email || '',
        password: passwordData.currentPassword,
      })

      if (signInError) {
        setPasswordError('Current password is incorrect')
        setPasswordLoading(false)
        return
      }

      // Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (updateError) {
        setPasswordError(updateError.message)
        setPasswordLoading(false)
        return
      }

      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setShowPasswordSection(false)

      // Auto-hide success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false)
      }, 3000)

    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fffcfb]">
      <SabiLoader text="Loading profile..." size="lg" />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-[#fffcfb]">
      {/* Header */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-600">My account</p>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900">
          Your <span className="font-serif italic text-red-600">profile</span>
        </h1>

        <div className="relative overflow-hidden mt-6 bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)]">
          <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
          <div className="px-6 py-6 sm:px-8 sm:py-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {profileData.avatar_url ? (
                  <img
                    src={profileData.avatar_url}
                    alt="Profile"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-2 ring-white shadow"
                  />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center ring-2 ring-white shadow">
                    <span className="text-4xl font-semibold text-white">
                      {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                )}
                {isEditing && (
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center ring-1 ring-rose-100 shadow-sm">
                    <Camera className="w-4 h-4 text-red-500" />
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-gray-900">
                  {profileData.full_name || 'Welcome!'}
                </h2>
                <p className="text-gray-500 text-sm mt-1">{userProfile?.email}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                    userProfile?.role === 'instructor'
                      ? 'bg-amber-50 text-amber-700 border border-amber-100'
                      : 'bg-rose-50 text-red-600 border border-rose-100'
                  }`}>
                    {userProfile?.role === 'instructor' ? (
                      <GraduationCap className="w-3 h-3" />
                    ) : (
                      <BookOpen className="w-3 h-3" />
                    )}
                    {userProfile?.role === 'instructor' ? 'Instructor' : 'Learner'}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <Shield className="w-3 h-3" />
                    Verified
                  </span>
                </div>
              </div>

              {/* Edit Button */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsEditing(false)
                        setError(null)
                      }}
                      className="bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveProfile}
                      disabled={isSaving}
                      className="relative overflow-hidden bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                      {isSaving ? (
                        <span className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Save
                        </span>
                      )}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* Password Success Message */}
        {passwordSuccess && (
          <div className="mb-6 bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="font-medium">Password changed successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-100 text-red-600 px-4 py-3 rounded-2xl flex items-center gap-3">
            <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Upload */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="relative bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base font-semibold tracking-tight text-gray-900">Profile Photo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col items-center">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-2xl object-cover ring-2 ring-white shadow"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center ring-2 ring-white shadow">
                      <span className="text-4xl font-semibold text-white">
                        {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-4 w-full">
                      <FileUploader
                        label="Upload Photo"
                        accept="image/*"
                        folder="avatars"
                        currentUrl={profileData.avatar_url}
                        onUpload={(url) => setProfileData({ ...profileData, avatar_url: url })}
                      />
                    </div>
                  )}
                </div>

                <div className="text-center pt-4 border-t border-rose-100">
                  <p className="text-sm font-medium text-gray-900">{userProfile?.email}</p>
                  <p className="text-xs text-gray-500 mt-1 capitalize flex items-center justify-center gap-1">
                    {userProfile?.role === 'instructor' ? (
                      <GraduationCap className="w-3 h-3" />
                    ) : (
                      <BookOpen className="w-3 h-3" />
                    )}
                    {userProfile?.role}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Security Card - Change Password */}
            <Card className="relative bg-white/85 backdrop-blur rounded-2xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-gray-900">Security</CardTitle>
                    <CardDescription className="text-xs">Manage your password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!showPasswordSection ? (
                  <Button
                    onClick={() => setShowPasswordSection(true)}
                    variant="outline"
                    className="w-full h-11 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {passwordError && (
                      <div className="bg-rose-50 border border-rose-100 text-red-600 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-gray-700">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="h-11 pl-10 pr-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-gray-700">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          className="h-11 pl-10 pr-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-medium text-gray-700">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className="h-11 pl-10 pr-10 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowPasswordSection(false)
                          setPasswordError(null)
                          setPasswordData({
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: '',
                          })
                        }}
                        className="flex-1 h-11 bg-white/70 backdrop-blur border border-rose-100 hover:border-rose-200 hover:bg-white text-gray-700 rounded-full shadow-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={passwordLoading}
                        className="relative overflow-hidden flex-1 h-11 bg-gradient-to-b from-red-500 to-rose-600 hover:to-rose-500 text-white font-semibold rounded-full shadow-[0_14px_30px_-10px_rgba(225,29,72,0.55)] ring-1 ring-red-600/50 transition-all hover:-translate-y-0.5"
                      >
                        <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
                        {passwordLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Updating...
                          </div>
                        ) : (
                          'Update'
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Info */}
          <div className="lg:col-span-2">
            <Card className="relative bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
              <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold tracking-tight text-gray-900">Personal Information</CardTitle>
                    <CardDescription className="text-xs">Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 disabled:bg-rose-50/40"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  <Input
                    value={userProfile?.email || ''}
                    disabled
                    className="h-12 rounded-xl bg-rose-50/40 border-rose-100 text-gray-500"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-[13px] font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/70 border border-rose-100 rounded-xl placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 disabled:bg-rose-50/40 text-sm"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Phone & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Phone Number
                    </label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+234 XXX XXX XXXX"
                      className="h-12 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 disabled:bg-rose-50/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Location
                    </label>
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Lagos, Nigeria"
                      className="h-12 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 disabled:bg-rose-50/40"
                    />
                  </div>
                </div>

                {/* Website (Instructors only) */}
                {userProfile?.role === 'instructor' && (
                  <div className="space-y-2">
                    <label className="text-[13px] font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      Website
                    </label>
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://yourwebsite.com"
                      className="h-12 rounded-xl bg-white/70 border-rose-100 placeholder:text-gray-400 focus:border-red-400 focus:ring-red-400 disabled:bg-rose-50/40"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructor Statistics */}
        {userProfile?.role === 'instructor' && (
          <Card className="relative mt-6 bg-white/85 backdrop-blur rounded-3xl border border-white ring-1 ring-rose-100 shadow-[0_12px_30px_-20px_rgba(225,29,72,0.35)] overflow-hidden">
            <span className="absolute top-0 inset-x-10 h-px bg-gradient-to-r from-transparent via-rose-300 to-transparent" aria-hidden="true" />
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base font-semibold tracking-tight text-gray-900">Instructor Statistics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-rose-500 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{instructorStats.totalCourses}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{instructorStats.totalStudents}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
                      <span className="text-white font-bold text-sm">₦</span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">₦{instructorStats.totalRevenue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}