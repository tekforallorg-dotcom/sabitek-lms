'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import FileUploader from '@/components/upload/file-uploader'

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
    }
  }, [user, userProfile, loading, router])

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information</p>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            Profile updated successfully!
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Avatar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center">
                  {profileData.avatar_url ? (
                    <img
                      src={profileData.avatar_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center border-4 border-gray-200">
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

                <div className="text-center pt-4 border-t">
                  <p className="text-sm font-medium text-gray-700">{userProfile?.email}</p>
                  <p className="text-sm text-gray-500 mt-1 capitalize">
                    {userProfile?.role}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Info */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>Update your personal details</CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="bg-red-500 hover:bg-red-600 text-white"
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(false)
                          setError(null)
                        }}
                        className="border-gray-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-red-500 hover:bg-red-600 text-white"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    value={profileData.full_name}
                    onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                    disabled={!isEditing}
                    className="h-11"
                  />
                </div>

                {/* Email (Read-only) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Email Address
                  </label>
                  <Input
                    value={userProfile?.email || ''}
                    disabled
                    className="h-11 bg-gray-100"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:border-red-500 focus:ring-red-500 disabled:bg-gray-50"
                    placeholder="Tell us about yourself..."
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <Input
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    disabled={!isEditing}
                    placeholder="+234 XXX XXX XXXX"
                    className="h-11"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <Input
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Lagos, Nigeria"
                    className="h-11"
                  />
                </div>

                {/* Website (Instructors only) */}
                {userProfile?.role === 'instructor' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Website
                    </label>
                    <Input
                      value={profileData.website}
                      onChange={(e) => setProfileData({ ...profileData, website: e.target.value })}
                      disabled={!isEditing}
                      placeholder="https://yourwebsite.com"
                      className="h-11"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Cards for Role-Specific Info */}
        {userProfile?.role === 'instructor' && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Instructor Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Courses</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Students</p>
                  <p className="text-2xl font-bold text-gray-900">0</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₦0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}