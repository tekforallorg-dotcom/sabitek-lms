'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import FileUploader from '@/components/upload/file-uploader'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/30">
        <div className="text-center">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-red-100 rounded-full"></div>
            <div className="w-14 h-14 border-4 border-red-500 border-t-transparent rounded-full animate-spin absolute inset-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900" />
        <div className="absolute inset-0 bg-gradient-to-tr from-red-900/20 via-transparent to-pink-900/20" />
        
        {/* Floating elements */}
        <div className="absolute top-10 right-[15%] w-24 h-24 bg-gradient-to-br from-red-500/10 to-pink-500/10 rounded-2xl rotate-12 blur-sm" />
        <div className="absolute bottom-10 left-[10%] w-16 h-16 bg-gradient-to-br from-pink-500/10 to-red-500/10 rounded-xl -rotate-12 blur-sm" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative">
              {profileData.avatar_url ? (
                <img
                  src={profileData.avatar_url}
                  alt="Profile"
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center border-4 border-white/20 shadow-xl">
                  <span className="text-4xl font-bold text-white">
                    {profileData.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
              )}
              {isEditing && (
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg">
                  <Camera className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">
                {profileData.full_name || 'Welcome!'}
              </h1>
              <p className="text-gray-400 text-sm mt-1">{userProfile?.email}</p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                  userProfile?.role === 'instructor' 
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                }`}>
                  {userProfile?.role === 'instructor' ? (
                    <GraduationCap className="w-3 h-3" />
                  ) : (
                    <BookOpen className="w-3 h-3" />
                  )}
                  {userProfile?.role === 'instructor' ? 'Instructor' : 'Learner'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30">
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
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 rounded-xl"
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
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl shadow-lg shadow-red-500/20"
                  >
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

        {/* Curved transition */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 40" fill="none" preserveAspectRatio="none" className="w-full h-6">
            <path d="M0 40V15C360 0 720 0 1080 15C1260 22 1380 30 1440 30V40H0Z" fill="#F9FAFB"/>
          </svg>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium">Profile updated successfully!</span>
          </div>
        )}

        {/* Password Success Message */}
        {passwordSuccess && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <span className="font-medium">Password changed successfully!</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar & Upload */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <CardTitle className="text-base">Profile Photo</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex flex-col items-center">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-2xl object-cover border-4 border-gray-100 shadow-lg"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-red-100 to-pink-100 flex items-center justify-center border-4 border-gray-100">
                      <span className="text-4xl font-bold text-red-500">
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

                <div className="text-center pt-4 border-t border-gray-100">
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
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Security</CardTitle>
                    <CardDescription className="text-xs">Manage your password</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {!showPasswordSection ? (
                  <Button
                    onClick={() => setShowPasswordSection(true)}
                    variant="outline"
                    className="w-full h-11 rounded-xl border-gray-200 hover:bg-gray-50"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Change Password
                  </Button>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-4">
                    {passwordError && (
                      <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {passwordError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Current Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          placeholder="Enter current password"
                          className="h-11 pl-10 pr-10 rounded-xl border-gray-200"
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
                      <label className="text-sm font-medium text-gray-700">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showNewPassword ? 'text' : 'password'}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Enter new password"
                          className="h-11 pl-10 pr-10 rounded-xl border-gray-200"
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
                      <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          placeholder="Confirm new password"
                          className="h-11 pl-10 pr-10 rounded-xl border-gray-200"
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
                        className="flex-1 h-11 rounded-xl border-gray-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={passwordLoading}
                        className="flex-1 h-11 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl"
                      >
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
            <Card className="rounded-2xl border-gray-100 shadow-sm overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Personal Information</CardTitle>
                    <CardDescription className="text-xs">Update your personal details</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name
                  </label>
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="h-12 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address
                  </label>
                  <Input
                    value={userProfile?.email || ''}
                    disabled
                    className="h-12 rounded-xl bg-gray-100 border-gray-200"
                  />
                  <p className="text-xs text-gray-500">Email cannot be changed</p>
                </div>

                {/* Bio */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    disabled={!isEditing}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50 text-sm"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Phone & Location Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-400" />
                      Phone Number
                    </label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      disabled={!isEditing}
                      placeholder="+234 XXX XXX XXXX"
                      className="h-12 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Location
                    </label>
                    <Input
                      value={profileData.location}
                      onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Lagos, Nigeria"
                      className="h-12 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Website (Instructors only) */}
                {userProfile?.role === 'instructor' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      Website
                    </label>
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://yourwebsite.com"
                      className="h-12 rounded-xl border-gray-200 focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Instructor Statistics */}
        {userProfile?.role === 'instructor' && (
          <Card className="mt-6 rounded-2xl border-gray-100 shadow-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100/50 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="text-base">Instructor Statistics</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-red-50 to-pink-50 p-5 rounded-xl border border-red-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Courses</p>
                      <p className="text-2xl font-bold text-gray-900">{instructorStats.totalCourses}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Total Students</p>
                      <p className="text-2xl font-bold text-gray-900">{instructorStats.totalStudents}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
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